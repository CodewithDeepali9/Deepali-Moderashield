import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  ModerationRule,
  ModerationResult,
  FlaggedSegment,
  CategoryScore,
  RuleCategory,
  OverallVerdict
} from './src/types/moderation.ts';
import {
  runDeterministicRuleMatching,
  generateHeuristicModerationResult
} from './src/utils/patternMatcher.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[ModeraShield] Gemini 3.8 Flash moderation service initialized.');
  } catch (err) {
    console.warn('[ModeraShield] Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.log('[ModeraShield] No GEMINI_API_KEY detected. Running in deterministic heuristic mode.');
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiEnabled: !!aiClient,
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// Moderation endpoint
app.post('/api/moderate', async (req: Request, res: Response) => {
  const startTime = performance.now();
  const { text, rules = [], strictness = 'standard' } = req.body as {
    text: string;
    rules: ModerationRule[];
    strictness?: 'lenient' | 'standard' | 'strict';
  };

  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'Field "text" must be a string' });
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return res.json(generateHeuristicModerationResult('', rules));
  }

  // 1. Run deterministic pattern rules first (Regex, PII, Banned Links/Keywords)
  const deterministicResult = runDeterministicRuleMatching(text, rules);
  const patternSegments = deterministicResult.flaggedSegments;

  // 2. If Gemini API is available, perform deep contextual semantic moderation
  if (aiClient) {
    try {
      const activeRules = rules.filter((r) => r.enabled);
      const rulesPromptList = activeRules
        .map(
          (r, idx) =>
            `${idx + 1}. [${r.id}] "${r.name}" (${r.category.toUpperCase()}, Severity: ${r.severity}, Action: ${r.action}): ${r.guideline}`
        )
        .join('\n');

      const systemInstruction = `You are ModeraShield, an enterprise content moderation AI.
Analyze user-generated text against the defined rules.
Detect subtle harassment, evasive obfuscations (l33tspeak, deliberate typos), hate speech, threats, scams, and context-dependent policy violations.
Strictness level: ${strictness}.
Respond ONLY with a valid JSON object matching the exact format:
{
  "overallRiskScore": number (0 to 100),
  "verdict": "APPROVED" | "FLAGGED" | "REJECTED" | "CRITICAL",
  "actionRecommended": "allow" | "manual_review" | "auto_redact" | "block_and_notify",
  "summaryReason": string (concise explanation of findings),
  "remediationAdvice": string (constructive guidance on how to fix),
  "flaggedSegments": [
    {
      "text": string (the exact violating substring from the text),
      "ruleId": string (one of the provided rule IDs),
      "ruleName": string,
      "category": string,
      "severity": "low" | "medium" | "high" | "critical",
      "action": "flag" | "redact" | "block",
      "reason": string (why this violates the rule),
      "suggestedReplacement": string (optional safer alternative or redaction label)
    }
  ],
  "categoryScores": {
    "hate_speech": number (0.0 to 1.0),
    "harassment": number (0.0 to 1.0),
    "pii": number (0.0 to 1.0),
    "spam": number (0.0 to 1.0),
    "profanity": number (0.0 to 1.0),
    "violence": number (0.0 to 1.0),
    "impersonation": number (0.0 to 1.0),
    "custom": number (0.0 to 1.0)
  }
}`;

      const userPrompt = `MODERATION RULES:
${rulesPromptList}

USER GENERATED TEXT TO ANALYZE:
"""
${text}
"""`;

      const geminiResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = geminiResponse.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      // Map AI flagged segments into segments with accurate start & end indices
      const aiSegments: FlaggedSegment[] = [];
      if (Array.isArray(parsed.flaggedSegments)) {
        let searchCursor = 0;
        for (const seg of parsed.flaggedSegments) {
          if (!seg.text) continue;
          const foundIndex = text.indexOf(seg.text, searchCursor);
          const startIndex = foundIndex !== -1 ? foundIndex : text.indexOf(seg.text);
          if (startIndex !== -1) {
            const endIndex = startIndex + seg.text.length;
            searchCursor = endIndex;
            aiSegments.push({
              id: `seg_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              startIndex,
              endIndex,
              text: seg.text,
              ruleId: seg.ruleId || 'rule_custom',
              ruleName: seg.ruleName || 'Policy Rule',
              category: (seg.category as RuleCategory) || 'custom',
              severity: seg.severity || 'medium',
              action: seg.action || 'flag',
              reason: seg.reason || 'Flagged by AI semantic rule engine',
              suggestedReplacement: seg.suggestedReplacement || '[FILTERED]',
            });
          }
        }
      }

      // Combine deterministic pattern segments and AI segments
      const mergedSegments: FlaggedSegment[] = [...patternSegments];
      for (const seg of aiSegments) {
        const overlap = mergedSegments.some(
          (m) => Math.max(m.startIndex, seg.startIndex) < Math.min(m.endIndex, seg.endIndex)
        );
        if (!overlap) {
          mergedSegments.push(seg);
        }
      }
      mergedSegments.sort((a, b) => a.startIndex - b.startIndex);

      // Generate sanitized text with redactions
      let sanitized = '';
      let lastIdx = 0;
      for (const seg of mergedSegments) {
        sanitized += text.slice(lastIdx, seg.startIndex);
        if (seg.action === 'redact' && seg.suggestedReplacement) {
          sanitized += seg.suggestedReplacement;
        } else {
          sanitized += seg.text;
        }
        lastIdx = seg.endIndex;
      }
      sanitized += text.slice(lastIdx);

      // Build categories list
      const catScores = parsed.categoryScores || {};
      const categories: CategoryScore[] = ([
        { category: 'hate_speech', label: 'Hate Speech & Bias', score: Number(catScores.hate_speech ?? 0.05), status: 'safe', violationsCount: 0 },
        { category: 'harassment', label: 'Harassment & Hostility', score: Number(catScores.harassment ?? 0.05), status: 'safe', violationsCount: 0 },
        { category: 'pii', label: 'PII & Confidentiality', score: Number(catScores.pii ?? (patternSegments.some(s => s.category === 'pii') ? 0.9 : 0.05)), status: 'safe', violationsCount: 0 },
        { category: 'spam', label: 'Spam & Commercial Scams', score: Number(catScores.spam ?? 0.05), status: 'safe', violationsCount: 0 },
        { category: 'profanity', label: 'Severe Profanity', score: Number(catScores.profanity ?? 0.05), status: 'safe', violationsCount: 0 },
        { category: 'violence', label: 'Physical Violence & Threats', score: Number(catScores.violence ?? 0.05), status: 'safe', violationsCount: 0 },
        { category: 'impersonation', label: 'Staff Impersonation', score: Number(catScores.impersonation ?? 0.05), status: 'safe', violationsCount: 0 },
        { category: 'custom', label: 'Custom Policy', score: Number(catScores.custom ?? 0.05), status: 'safe', violationsCount: 0 },
      ] as { category: RuleCategory; label: string; score: number; status: 'safe' | 'warning' | 'violation'; violationsCount: number }[]).map((cat) => {
        const segCount = mergedSegments.filter((s) => s.category === cat.category).length;
        cat.violationsCount = segCount;
        if (segCount > 0 && cat.score < 0.6) {
          cat.score = 0.75;
        }
        cat.status = cat.score > 0.6 ? 'violation' : cat.score > 0.25 ? 'warning' : 'safe';
        return cat;
      });

      // Calibrate final verdict if deterministic found high/critical
      let finalVerdict: OverallVerdict = parsed.verdict || 'APPROVED';
      const hasCritical = mergedSegments.some((s) => s.severity === 'critical');
      const hasHigh = mergedSegments.some((s) => s.severity === 'high');

      if (hasCritical) finalVerdict = 'CRITICAL';
      else if (hasHigh && finalVerdict !== 'CRITICAL') finalVerdict = 'REJECTED';
      else if (mergedSegments.length > 0 && finalVerdict === 'APPROVED') finalVerdict = 'FLAGGED';

      const executionTimeMs = Math.round(performance.now() - startTime);

      const finalResult: ModerationResult = {
        id: `mod_gemini_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        timestamp: new Date().toISOString(),
        inputText: text,
        verdict: finalVerdict,
        overallRiskScore: Math.min(100, Math.max(parsed.overallRiskScore ?? 0, hasCritical ? 95 : hasHigh ? 80 : mergedSegments.length * 20)),
        actionRecommended: parsed.actionRecommended || (hasCritical || hasHigh ? 'block_and_notify' : mergedSegments.length > 0 ? 'auto_redact' : 'allow'),
        flaggedSegments: mergedSegments,
        categories,
        sanitizedText: sanitized,
        summaryReason: parsed.summaryReason || (mergedSegments.length > 0 ? `Detected ${mergedSegments.length} flagged segments.` : 'Clean content.'),
        remediationAdvice: parsed.remediationAdvice,
        executionTimeMs,
        engineUsed: 'ai_gemini',
      };

      return res.json(finalResult);
    } catch (geminiError) {
      console.warn('[ModeraShield] Gemini generation error, falling back to heuristic engine:', geminiError);
    }
  }

  // Fallback to deterministic + heuristic engine
  const fallbackResult = generateHeuristicModerationResult(text, rules, patternSegments);
  fallbackResult.executionTimeMs = Math.round(performance.now() - startTime);
  return res.json(fallbackResult);
});

// Configure Dev / Prod Vite serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ModeraShield] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
