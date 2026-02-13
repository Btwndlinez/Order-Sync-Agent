/**
 * Intent Filter - Heuristic Regex-Based Classification
 * Three categories: Pre-Sale (COMMERCE), Post-Sale (SUPPORT), Friction (INTERVENTION)
 */

export type IntentType = 'COMMERCE' | 'SUPPORT' | 'INTERVENTION';
export type Priority = 'HIGH' | 'MEDIUM' | 'URGENT';

export interface IntentResult {
  intent: IntentType;
  priority: Priority;
  matchedPatterns: string[];
}

const PRE_SALE_PATTERNS = [
  /buy/i,
  /purchase/i,
  /order/i,
  /want/i,
  /need/i,
  /get\s+(me|one|it|this)/i,
  /how\s+much/i,
  /price/i,
  /cost/i,
  /available/i,
  /in\s+stock/i,
  /shipping/i,
  /delivery/i,
  /can\s+i\s+get/i,
  /do\s+you\s+have/i,
  /looking\s+for/i,
  /interested\s+in/i,
  /send\s+me/i,
  /checkout/i,
  /pay/i,
  /invoice/i,
  /quote/i,
  /deal/i,
  /discount/i,
  /size/i,
  /color/i,
  /variant/i,
];

const POST_SALE_PATTERNS = [
  /order\s+(status|update|number|confirm)/i,
  /shipping\s+(update|delay|address)/i,
  /track(ing)?/i,
  /delivery\s+(update|issue|problem)/i,
  /return/i,
  /refund/i,
  /exchange/i,
  /cancel/i,
  /wrong\s+(item|size|color)/i,
  /damaged/i,
  /missing/i,
  /not\s+(receive|arrived)/i,
  /where\s+(is|are)\s+my/i,
  /tracking/i,
  /arrived/i,
  /received/i,
  /confirm\s+(order|delivery)/i,
  /receipt/i,
  /payment\s+issue/i,
  /billing/i,
];

const FRICTION_PATTERNS = [
  /help/i,
  /urgent/i,
  /asap/i,
  /emergency/i,
  /not\s+working/i,
  /broken/i,
  /scam/i,
  /fake/i,
  /ripoff/i,
  /terrible/i,
  /awful/i,
  /worst/i,
  /complaint/i,
  /angry/i,
  /frustrated/i,
  /disappointed/i,
  /unacceptable/i,
  /refund\s+now/i,
  /cancel\s+order/i,
  /speak\s+(to|a)\s+(manager|supervisor|human)/i,
  /reporting?\s+(you|this)/i,
  /legal/i,
  / lawyer/i,
  /going\s+to\s+(sue|report)/i,
  /better\s+(business|bureau|bbc)/i,
  /paypal\s+dispute/i,
  /credit\s+card\s+dispute/i,
  /chargeback/i,
];

function matchPatterns(text: string, patterns: RegExp[]): string[] {
  const matched: string[] = [];
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      matched.push(pattern.source);
    }
  }
  return matched;
}

export function getIntent(text: string): IntentResult | null {
  if (!text || text.trim().length < 2) {
    return null;
  }

  const frictionMatches = matchPatterns(text, FRICTION_PATTERNS);
  if (frictionMatches.length > 0) {
    return {
      intent: 'INTERVENTION',
      priority: 'URGENT',
      matchedPatterns: frictionMatches
    };
  }

  const commerceMatches = matchPatterns(text, PRE_SALE_PATTERNS);
  if (commerceMatches.length > 0) {
    return {
      intent: 'COMMERCE',
      priority: 'HIGH',
      matchedPatterns: commerceMatches
    };
  }

  const supportMatches = matchPatterns(text, POST_SALE_PATTERNS);
  if (supportMatches.length > 0) {
    return {
      intent: 'SUPPORT',
      priority: 'MEDIUM',
      matchedPatterns: supportMatches
    };
  }

  return null;
}

export function getIntentLabel(intent: IntentType): string {
  const labels: Record<IntentType, string> = {
    'COMMERCE': '💰 Pre-Sale / Commerce',
    'SUPPORT': '🎧 Post-Sale / Support',
    'INTERVENTION': '🚨 Friction / Intervention'
  };
  return labels[intent];
}

export function getPriorityEmoji(priority: Priority): string {
  const emojis: Record<Priority, string> = {
    'HIGH': '🔴',
    'MEDIUM': '🟡',
    'URGENT': '🚨'
  };
  return emojis[priority];
}

export function classifyBulk(messages: string[]): Map<string, IntentResult | null> {
  const results = new Map<string, IntentResult | null>();
  for (const msg of messages) {
    results.set(msg, getIntent(msg));
  }
  return results;
}
