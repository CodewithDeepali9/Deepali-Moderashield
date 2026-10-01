import { BatchItem } from '../types/moderation';

export interface SamplePreset {
  id: string;
  title: string;
  category: string;
  description: string;
  text: string;
  expectedOutcome: 'Approved' | 'Flagged' | 'Rejected' | 'Redacted';
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'sample_safe',
    title: 'Constructive Community Feedback',
    category: 'Product Review',
    description: 'Helpful and polite technical commentary with zero violations.',
    text: 'I really appreciate the recent update to the export interface! The CSV download is twice as fast now. One small suggestion: could we add a keyboard shortcut for copying the table data? Keep up the fantastic work team!',
    expectedOutcome: 'Approved'
  },
  {
    id: 'sample_pii',
    title: 'Exposed PII & Credit Card',
    category: 'Privacy Leak',
    description: 'Customer inadvertently posts SSN, credit card number, and contact info in a public review.',
    text: 'Hi support, my billing email is client.alex@enterprise-cloud.io and my phone is 415-555-8392. My corporate card is 4532-1198-2938-4012 and SSN for tax verification is 987-65-4321. Please refund the $49 charge immediately.',
    expectedOutcome: 'Redacted'
  },
  {
    id: 'sample_toxic',
    title: 'Hostile Harassment & Cyberbullying',
    category: 'Gaming Chat',
    description: 'Severe personal attacks, abusive slurs, and malicious harassment.',
    text: 'You are the most useless player on this entire team you complete piece of shit. Delete your account and never play again, nobody likes you and everyone wishes you would just kys.',
    expectedOutcome: 'Rejected'
  },
  {
    id: 'sample_spam',
    title: 'Crypto Pump & Phishing Scheme',
    category: 'Spam Bot',
    description: 'Typical spam bot comment promoting fake high-yield investment signals and telegram channels.',
    text: '🚀 INCREDIBLE OPPORTUNITY!! I made $18,400 this week alone trading with Professor James! Guaranteed 300% weekly returns, completely risk-free passive income. Contact him directly on Telegram: t.me/crypto_signals_vip or claim your free token bonus at bit.ly/claim-bonus-2026! 💰🔥',
    expectedOutcome: 'Rejected'
  },
  {
    id: 'sample_impersonate',
    title: 'Platform Admin Impersonation',
    category: 'Account Phishing',
    description: 'Malicious actor pretending to be a moderator to steal user login credentials.',
    text: 'ATTENTION USER: I am the lead system administrator and platform security officer. Your profile has triggered a security breach warning. Reply immediately with your current password and 6-digit authenticator code or your account will be permanently banned within 15 minutes.',
    expectedOutcome: 'Rejected'
  },
  {
    id: 'sample_borderline',
    title: 'Heated Debate / Borderline Sarcasm',
    category: 'Nuance Test',
    description: 'Emotionally charged product critique that expresses frustration without violating harassment policies.',
    text: 'Honestly, this latest patch is an absolute joke. Did QA even boot the application once before deploying this catastrophe? The search bar crashes 8 times out of 10. Fix your software before asking for subscription renewals.',
    expectedOutcome: 'Approved'
  }
];

export const INITIAL_BATCH_ITEMS: BatchItem[] = [
  {
    id: 'batch_01',
    author: 'miko_dev',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    timestamp: '2 mins ago',
    context: 'forum_comment',
    text: 'Great tutorial on implementing web sockets! The reconnect exponential backoff logic was especially clear and saved me hours.',
    status: 'pending'
  },
  {
    id: 'batch_02',
    author: 'fast_crypto_trader',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    timestamp: '4 mins ago',
    context: 'forum_comment',
    text: 'DOUBLE YOUR SOLANA IN 24 HOURS! Guaranteed no loss program. Join our official group t.me/solana_whale_pump today before spots run out.',
    status: 'pending'
  },
  {
    id: 'batch_03',
    author: 'jordan_b',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    timestamp: '7 mins ago',
    context: 'support_ticket',
    text: 'Please cancel my order. Here is my phone 312-555-0143 and credit card 5123456789012345 expiring 09/27. Thanks!',
    status: 'pending'
  },
  {
    id: 'batch_04',
    author: 'xX_shadow_slayer_Xx',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    timestamp: '11 mins ago',
    context: 'chat_message',
    text: 'Go fuck yourself you blind noob. Uninstall the game right now or I swear I will hunt you down.',
    status: 'pending'
  },
  {
    id: 'batch_05',
    author: 'elena_rodriguez',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    timestamp: '15 mins ago',
    context: 'product_review',
    text: 'The battery life exceeded my expectations by almost 30%. Build quality feels premium and lightweight.',
    status: 'pending'
  },
  {
    id: 'batch_06',
    author: 'sys_admin_official',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    timestamp: '18 mins ago',
    context: 'chat_message',
    text: 'I am the system administrator for the discord server. Send me your password to verify your account security.',
    status: 'pending'
  }
];
