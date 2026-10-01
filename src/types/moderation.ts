export type RuleCategory = 
  | 'hate_speech'
  | 'harassment'
  | 'pii'
  | 'spam'
  | 'profanity'
  | 'violence'
  | 'impersonation'
  | 'custom';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type EnforcementAction = 'flag' | 'redact' | 'block';

export type RuleEngineType = 'semantic' | 'regex' | 'keyword' | 'hybrid';

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: SeverityLevel;
  action: EnforcementAction;
  enabled: boolean;
  type: RuleEngineType;
  patterns: string[]; // Keywords or regex patterns
  guideline: string; // Specific policy definition
  isDefault?: boolean;
}

export interface FlaggedSegment {
  id: string;
  startIndex: number;
  endIndex: number;
  text: string;
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: SeverityLevel;
  action: EnforcementAction;
  reason: string;
  suggestedReplacement?: string;
  matchedPattern?: string;
}

export interface CategoryScore {
  category: RuleCategory;
  label: string;
  score: number; // 0.0 to 1.0
  status: 'safe' | 'warning' | 'violation';
  violationsCount: number;
}

export type OverallVerdict = 'APPROVED' | 'FLAGGED' | 'REJECTED' | 'CRITICAL';

export interface ModerationResult {
  id: string;
  timestamp: string;
  inputText: string;
  verdict: OverallVerdict;
  overallRiskScore: number; // 0 to 100
  actionRecommended: 'allow' | 'manual_review' | 'auto_redact' | 'block_and_notify';
  flaggedSegments: FlaggedSegment[];
  categories: CategoryScore[];
  sanitizedText: string;
  summaryReason: string;
  remediationAdvice?: string;
  executionTimeMs: number;
  engineUsed: 'ai_gemini' | 'hybrid' | 'pattern_heuristic';
}

export interface BatchItem {
  id: string;
  author: string;
  avatarUrl?: string;
  timestamp: string;
  context: 'forum_comment' | 'user_bio' | 'product_review' | 'chat_message' | 'support_ticket';
  text: string;
  status: 'pending' | 'analyzing' | 'approved' | 'flagged' | 'rejected';
  result?: ModerationResult;
}

export interface RuleTestCase {
  id: string;
  ruleId: string;
  ruleName: string;
  input: string;
  expectedVerdict: 'VIOLATION' | 'SAFE';
  note: string;
}
