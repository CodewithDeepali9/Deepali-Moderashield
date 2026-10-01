import {
  ModerationRule,
  FlaggedSegment,
  ModerationResult,
  CategoryScore,
  RuleCategory,
  OverallVerdict
} from '../types/moderation';

export function runDeterministicRuleMatching(
  text: string,
  rules: ModerationRule[]
): {
  flaggedSegments: FlaggedSegment[];
  sanitizedText: string;
} {
  const enabledRules = rules.filter(r => r.enabled);
  const segments: FlaggedSegment[] = [];

  for (const rule of enabledRules) {
    if (rule.type === 'semantic') {
      // Semantic-only rules will be analyzed by AI or heuristic fallback
      continue;
    }

    for (const pattern of rule.patterns) {
      if (!pattern || pattern.trim().length === 0) continue;

      try {
        let regex: RegExp;
        if (rule.type === 'regex') {
          regex = new RegExp(pattern, 'gi');
        } else {
          // keyword or hybrid: escape regex special chars, use word boundary or substring
          const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        }

        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          const matchedStr = match[0];
          const startIndex = match.index;
          const endIndex = startIndex + matchedStr.length;

          // Check if already captured by another segment with exact overlap
          const alreadyCaptured = segments.some(
            s => Math.max(s.startIndex, startIndex) < Math.min(s.endIndex, endIndex)
          );

          if (!alreadyCaptured) {
            let replacement = '[REDACTED]';
            if (rule.category === 'pii') {
              if (matchedStr.includes('@')) replacement = '[REDACTED_EMAIL]';
              else if (matchedStr.length > 12 && /^\d/.test(matchedStr)) replacement = '[REDACTED_CARD]';
              else if (/^\d{3}-\d{2}-\d{4}$/.test(matchedStr)) replacement = '[REDACTED_SSN]';
              else replacement = '[REDACTED_PII]';
            } else if (rule.category === 'profanity') {
              replacement = '*'.repeat(Math.max(3, matchedStr.length));
            } else if (rule.action === 'redact') {
              replacement = `[FILTERED_${rule.category.toUpperCase()}]`;
            }

            segments.push({
              id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              startIndex,
              endIndex,
              text: matchedStr,
              ruleId: rule.id,
              ruleName: rule.name,
              category: rule.category,
              severity: rule.severity,
              action: rule.action,
              reason: `Matched ${rule.type} rule: "${rule.name}" (${pattern})`,
              suggestedReplacement: replacement,
              matchedPattern: pattern
            });
          }
        }
      } catch (err) {
        console.warn(`Invalid regex pattern in rule ${rule.name}:`, pattern, err);
      }
    }
  }

  // Sort segments by start index
  segments.sort((a, b) => a.startIndex - b.startIndex);

  // Generate sanitized text
  let sanitized = '';
  let lastIndex = 0;
  for (const seg of segments) {
    sanitized += text.slice(lastIndex, seg.startIndex);
    if (seg.action === 'redact' && seg.suggestedReplacement) {
      sanitized += seg.suggestedReplacement;
    } else {
      sanitized += seg.text; // Keep or mark based on action
    }
    lastIndex = seg.endIndex;
  }
  sanitized += text.slice(lastIndex);

  return {
    flaggedSegments: segments,
    sanitizedText: sanitized
  };
}

export function generateHeuristicModerationResult(
  inputText: string,
  rules: ModerationRule[],
  additionalSegments: FlaggedSegment[] = []
): ModerationResult {
  const startTime = performance.now();
  const { flaggedSegments: patternSegments, sanitizedText } = runDeterministicRuleMatching(inputText, rules);

  // Combine pattern segments and any semantic segments
  const allSegments = [...patternSegments];
  for (const seg of additionalSegments) {
    const exists = allSegments.some(
      s => Math.max(s.startIndex, seg.startIndex) < Math.min(s.endIndex, seg.endIndex)
    );
    if (!exists) {
      allSegments.push(seg);
    }
  }

  allSegments.sort((a, b) => a.startIndex - b.startIndex);

  // Categories list
  const categoryMap: Record<RuleCategory, { label: string; count: number; maxSeverityWeight: number }> = {
    hate_speech: { label: 'Hate Speech & Bias', count: 0, maxSeverityWeight: 0 },
    harassment: { label: 'Harassment & Hostility', count: 0, maxSeverityWeight: 0 },
    pii: { label: 'PII & Confidentiality', count: 0, maxSeverityWeight: 0 },
    spam: { label: 'Spam & Commercial Scams', count: 0, maxSeverityWeight: 0 },
    profanity: { label: 'Severe Profanity', count: 0, maxSeverityWeight: 0 },
    violence: { label: 'Physical Violence & Threats', count: 0, maxSeverityWeight: 0 },
    impersonation: { label: 'Staff Impersonation', count: 0, maxSeverityWeight: 0 },
    custom: { label: 'Custom Policy', count: 0, maxSeverityWeight: 0 }
  };

  const severityWeights: Record<string, number> = {
    low: 0.25,
    medium: 0.55,
    high: 0.85,
    critical: 1.0
  };

  for (const seg of allSegments) {
    const cat = categoryMap[seg.category] || categoryMap.custom;
    cat.count++;
    const weight = severityWeights[seg.severity] || 0.3;
    if (weight > cat.maxSeverityWeight) {
      cat.maxSeverityWeight = weight;
    }
  }

  const categories: CategoryScore[] = (Object.keys(categoryMap) as RuleCategory[]).map(key => {
    const data = categoryMap[key];
    const score = data.count > 0 ? Math.min(1.0, data.maxSeverityWeight * 0.8 + (data.count - 1) * 0.1) : 0.02;
    let status: 'safe' | 'warning' | 'violation' = 'safe';
    if (score > 0.6) status = 'violation';
    else if (score > 0.25) status = 'warning';

    return {
      category: key,
      label: data.label,
      score: Number(score.toFixed(2)),
      status,
      violationsCount: data.count
    };
  });

  // Calculate Overall Risk Score
  let maxWeight = 0;
  let hasCritical = false;
  let hasHigh = false;
  let hasMedium = false;

  for (const seg of allSegments) {
    const w = severityWeights[seg.severity] || 0.3;
    if (w > maxWeight) maxWeight = w;
    if (seg.severity === 'critical') hasCritical = true;
    if (seg.severity === 'high') hasHigh = true;
    if (seg.severity === 'medium') hasMedium = true;
  }

  let overallRiskScore = 0;
  if (allSegments.length > 0) {
    const countFactor = Math.min(25, (allSegments.length - 1) * 8);
    overallRiskScore = Math.min(100, Math.round(maxWeight * 75 + countFactor));
  }

  // Verdict and action
  let verdict: OverallVerdict = 'APPROVED';
  let actionRecommended: ModerationResult['actionRecommended'] = 'allow';
  let summaryReason = 'Content adheres to all active moderation guidelines. No policy violations detected.';

  if (hasCritical) {
    verdict = 'CRITICAL';
    actionRecommended = 'block_and_notify';
    summaryReason = `Critical policy violation detected (${allSegments.filter(s => s.severity === 'critical').map(s => s.ruleName).join(', ')}). Immediate blocking required.`;
  } else if (hasHigh) {
    verdict = 'REJECTED';
    actionRecommended = 'block_and_notify';
    summaryReason = `High severity violation detected (${allSegments.filter(s => s.severity === 'high').map(s => s.ruleName).join(', ')}). Auto-rejected.`;
  } else if (hasMedium || allSegments.length > 0) {
    verdict = 'FLAGGED';
    const hasRedact = allSegments.some(s => s.action === 'redact');
    actionRecommended = hasRedact ? 'auto_redact' : 'manual_review';
    summaryReason = `Minor or moderate flags found (${allSegments.map(s => s.ruleName).join(', ')}). Content flagged for review or automated redaction.`;
  }

  // Remediation advice
  let remediationAdvice: string | undefined;
  if (allSegments.length > 0) {
    remediationAdvice = `To make this text compliant: ${allSegments
      .map(s => `Remove or rephrase "${s.text.length > 25 ? s.text.substring(0, 25) + '...' : s.text}" (${s.ruleName})`)
      .slice(0, 3)
      .join('; ')}.`;
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    inputText,
    verdict,
    overallRiskScore,
    actionRecommended,
    flaggedSegments: allSegments,
    categories,
    sanitizedText,
    summaryReason,
    remediationAdvice,
    executionTimeMs,
    engineUsed: 'pattern_heuristic'
  };
}
