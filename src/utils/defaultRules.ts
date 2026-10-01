import { ModerationRule, RuleTestCase } from '../types/moderation';

export const DEFAULT_RULES: ModerationRule[] = [
  {
    id: 'rule_hate_speech',
    name: 'Hate Speech & Identity Bias',
    description: 'Prohibits attacks, dehumanizing speech, or slurs targeting protected characteristics (race, ethnicity, religion, disability, gender, sexual orientation).',
    category: 'hate_speech',
    severity: 'high',
    action: 'block',
    enabled: true,
    type: 'hybrid',
    patterns: [
      'subhuman',
      'inferior race',
      'go back to your country',
      'hate all (jews|muslims|christians|immigrants|trans|gays)',
      'kill all (men|women|whites|blacks|asians)'
    ],
    guideline: 'Strictly prohibit any content that promotes violence, incites hatred, promotes discrimination, or disparages on the basis of protected characteristics. Contextual analysis should allow educational discussion while blocking hateful intent.',
    isDefault: true
  },
  {
    id: 'rule_harassment',
    name: 'Targeted Harassment & Hostility',
    description: 'Prohibits cyberbullying, malicious stalking, threatening personal insults, and doxxing threats directed at individuals.',
    category: 'harassment',
    severity: 'high',
    action: 'block',
    enabled: true,
    type: 'semantic',
    patterns: [
      'you should be ashmed of yourself',
      'nobody likes you',
      'kill yourself',
      'kys',
      'watch your back',
      'i know where you live'
    ],
    guideline: 'Flag or block direct personal attacks, repetitive badgering, malicious intimidation, or encouragement of physical or mental self-harm. Sarcasm aimed at tormenting a user should be caught.',
    isDefault: true
  },
  {
    id: 'rule_pii',
    name: 'PII & Confidential Credentials',
    description: 'Detects and redacts sensitive private data including Social Security Numbers, credit cards, emails, phone numbers, and cloud API keys.',
    category: 'pii',
    severity: 'critical',
    action: 'redact',
    enabled: true,
    type: 'regex',
    patterns: [
      '\\b\\d{3}-\\d{2}-\\d{4}\\b', // SSN
      '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b', // Credit Cards
      '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b', // Email
      '\\b(?:\\+?1[-. ]?)?\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\\b', // Phone Number
      '\\b(AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{24,}|ghp_[a-zA-Z0-9]{30,})\\b' // Secret API Keys
    ],
    guideline: 'Must protect user privacy by identifying personally identifiable information. Standard operational action is to automatically redact or mask the matched sequence before storage or broadcast.',
    isDefault: true
  },
  {
    id: 'rule_spam',
    name: 'Spam, Phishing & Commercial Scams',
    description: 'Flags unsolicited commercial spam, get-rich-quick crypto schemes, shortened deceptive links, and telegram/whatsapp recruitment bots.',
    category: 'spam',
    severity: 'medium',
    action: 'block',
    enabled: true,
    type: 'hybrid',
    patterns: [
      't\\.me\\/[a-zA-Z0-9_]+',
      'wa\\.me\\/[0-9]+',
      'bit\\.ly\\/[a-zA-Z0-9]+',
      'guaranteed (\\d+%|returns|profit)',
      'passive income DM me',
      'invest \\$\\d+ to make \\$\\d+',
      'click this link to claim free'
    ],
    guideline: 'Detect deceptive advertising, affiliate link spam, investment pyramid schemes, bot invitation channels, and bulk repeated text designed to hijack community conversations.',
    isDefault: true
  },
  {
    id: 'rule_profanity',
    name: 'Severe Profanity & Obscenity',
    description: 'Identifies explicit vulgarities, aggressive expletives, and sexually explicit insults.',
    category: 'profanity',
    severity: 'medium',
    action: 'redact',
    enabled: true,
    type: 'keyword',
    patterns: [
      'fuck',
      'shit',
      'bitch',
      'asshole',
      'dickhead',
      'bastard',
      'motherfucker',
      'cunt'
    ],
    guideline: 'Censor or flag high-intensity vulgarities. Filter allows moderate emotional expressions in benign contexts while masking toxic hostile outbursts.',
    isDefault: true
  },
  {
    id: 'rule_violence',
    name: 'Physical Violence & Weapons Threats',
    description: 'Detects explicit threats of physical injury, violence incitement, assassination, or weapons deployment.',
    category: 'violence',
    severity: 'critical',
    action: 'block',
    enabled: true,
    type: 'semantic',
    patterns: [
      'i will kill you',
      'bring a gun to',
      'blow up the',
      'break your neck',
      'slit your throat'
    ],
    guideline: 'Zero tolerance for direct threats of physical violence, weapons attacks, assault, or terrorism. Requires immediate rejection and risk escalation.',
    isDefault: true
  },
  {
    id: 'rule_impersonation',
    name: 'Staff Impersonation & Credential Theft',
    description: 'Catches deceptive attempts to pretend to be platform administrators, system security, or support staff to solicit passwords.',
    category: 'impersonation',
    severity: 'high',
    action: 'block',
    enabled: true,
    type: 'semantic',
    patterns: [
      'i am the (admin|moderator|system administrator)',
      'send me your password',
      'official support team verifying your account',
      'account suspended unless you reply with your pin'
    ],
    guideline: 'Block users claiming official administrative authority, asking for passwords, tokens, or security OTPs.',
    isDefault: true
  }
];

export const DEFAULT_TEST_CASES: RuleTestCase[] = [
  {
    id: 'tc_1',
    ruleId: 'rule_pii',
    ruleName: 'PII & Confidential Credentials',
    input: 'Hey Sarah, my backup phone is 415-555-0199 and my social is 123-45-6789. Please keep it confidential.',
    expectedVerdict: 'VIOLATION',
    note: 'Tests phone number and SSN detection with automatic redaction.'
  },
  {
    id: 'tc_2',
    ruleId: 'rule_pii',
    ruleName: 'PII & Confidential Credentials',
    input: 'The product model number is 123-456-7890 which was released in 2024.',
    expectedVerdict: 'SAFE',
    note: 'Negative test: verify product catalog serial does not falsely trigger SSN regex.'
  },
  {
    id: 'tc_3',
    ruleId: 'rule_spam',
    ruleName: 'Spam, Phishing & Commercial Scams',
    input: 'Make $5000 weekly from home! Join our VIP crypto trading signals right now on t.me/fast_wealth_bot guaranteed profit!',
    expectedVerdict: 'VIOLATION',
    note: 'Tests telegram bot link and scam financial promise detection.'
  },
  {
    id: 'tc_4',
    ruleId: 'rule_harassment',
    ruleName: 'Targeted Harassment & Hostility',
    input: 'You are so utterly pathetic, nobody in this community wants you here, just kys already.',
    expectedVerdict: 'VIOLATION',
    note: 'Tests severe hostility and self-harm incitement.'
  },
  {
    id: 'tc_5',
    ruleId: 'rule_hate_speech',
    ruleName: 'Hate Speech & Identity Bias',
    input: 'We should celebrate our cultural heritage and learn about historical immigration patterns in Europe.',
    expectedVerdict: 'SAFE',
    note: 'Negative test: Benign discussion of immigration history should pass without false positive.'
  },
  {
    id: 'tc_6',
    ruleId: 'rule_profanity',
    ruleName: 'Severe Profanity & Obscenity',
    input: 'This fucking update broke my entire setup and that asshole developer never replies.',
    expectedVerdict: 'VIOLATION',
    note: 'Tests explicit profanity detection for redaction or moderation flag.'
  },
  {
    id: 'tc_7',
    ruleId: 'rule_violence',
    ruleName: 'Physical Violence & Weapons Threats',
    input: 'The protagonist in the novel threatened to break into the castle and challenge the evil king to a duel.',
    expectedVerdict: 'SAFE',
    note: 'Literary/fictional context test: benign novel review should pass.'
  }
];
