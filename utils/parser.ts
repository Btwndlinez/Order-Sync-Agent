/**
 * Intent Engine - Message Parsing Pipeline (Stages 1-4)
 * Processes raw messages into structured intent data before catalog matching
 */

// ============================================================================
// STAGE 1: NORMALIZATION
// ============================================================================

/**
 * Normalize text: lowercase, remove emojis, strip punctuation, trim
 */
export function normalize(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[^\w\s$]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// STAGE 2: TOKENIZATION
// ============================================================================

/**
 * Split normalized text into array of words
 */
export function tokenize(text: string): string[] {
  const normalized = normalize(text);
  return normalized.split(' ').filter(word => word.length > 0);
}

// ============================================================================
// STAGE 3: INTENT CLASSIFICATION
// ============================================================================

const PURCHASE_KEYWORDS = [
  'buy', 'take', 'want', 'need', 'order', 'purchase', 'get',
  'ship', 'shipping', 'deliver', 'delivery',
  'checkout', 'pay', 'payment', 'cost', 'price', 'total',
  'reserve', 'hold', 'preorder', 'backorder'
];

const INQUIRY_KEYWORDS = [
  'how', 'much', 'available', 'stock', 'still', 'check',
  'ask', 'question', 'wonder', 'info', 'information'
];

const MODIFIER_KEYWORDS = [
  'size', 'color', 'colour', 'small', 'medium', 'large', 'xl', 'xxl', 'xs',
  'black', 'white', 'red', 'blue', 'green', 'pink', 'purple', 'yellow',
  'brown', 'gray', 'grey', 'navy', 'beige', 'orange', 'tan'
];

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but',
  'if', 'or', 'because', 'until', 'while', 'about', 'against', 'this',
  'that', 'these', 'those', 'am', 'it', 'its', 'i', 'you', 'he', 'she',
  'they', 'we', 'my', 'your', 'his', 'her', 'their', 'our'
]);

/**
 * Word to number mapping
 */
const WORD_NUMBERS: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'dozen': 12, 'half': 0.5
};

/**
 * Classify intent from tokens
 * Returns score 0-1
 */
export function classifyIntent(tokens: string[]): {
  score: number;
  type: 'purchase' | 'inquiry' | 'unknown';
  keywords: string[];
} {
  if (tokens.length === 0) {
    return { score: 0, type: 'unknown', keywords: [] };
  }

  const foundPurchaseKeywords = tokens.filter(t => PURCHASE_KEYWORDS.includes(t));
  const foundInquiryKeywords = tokens.filter(t => INQUIRY_KEYWORDS.includes(t));
  
  const hasNumber = /\d/.test(tokens.join(' '));
  const hasWordNumber = Object.keys(WORD_NUMBERS).some(w => tokens.includes(w));
  
  let score = 0;
  let type: 'purchase' | 'inquiry' | 'unknown' = 'unknown';
  const keywords: string[] = [];

  // Purchase intent scoring
  if (foundPurchaseKeywords.length > 0) {
    score += 0.4;
    keywords.push(...foundPurchaseKeywords);
  }

  // Number presence (quantity or price)
  if (hasNumber || hasWordNumber) {
    score += 0.3;
  }

  // Inquiry keywords
  if (foundInquiryKeywords.length > 0) {
    score += 0.2;
    keywords.push(...foundInquiryKeywords);
  }

  // Context: "want X" or "need X" patterns
  const contextPatterns = [
    /^(want|need|buy|take|get|order)\s+\w+/,
    /how\s+much/,
    /is\s+(it|this|that)\s+(available|in\s+stock)/
  ];
  
  const fullText = tokens.join(' ');
  for (const pattern of contextPatterns) {
    if (pattern.test(fullText)) {
      score += 0.2;
      break;
    }
  }

  // Determine type
  if (score >= 0.4 && foundPurchaseKeywords.length > 0) {
    type = 'purchase';
  } else if (score >= 0.2 && foundInquiryKeywords.length > 0) {
    type = 'inquiry';
  }

  return {
    score: Math.min(score, 1),
    type,
    keywords: [...new Set(keywords)]
  };
}

// ============================================================================
// STAGE 4: ENTITY EXTRACTION
// ============================================================================

export interface ExtractedEntities {
  quantity: number | null;
  price: string | null;
  attributes: string[];
  productCandidate: string | null;
  originalText: string;
}

/**
 * Extract entities: quantity, price, attributes, product candidate
 */
export function extractEntities(text: string): ExtractedEntities {
  const normalized = normalize(text);
  const tokens = tokenize(text);
  
  let quantity: number | null = null;
  let price: string | null = null;
  const attributes: string[] = [];
  
  // Extract quantity: digits or word-numbers
  const digitMatch = text.match(/\b(\d+)\b/);
  if (digitMatch) {
    quantity = parseInt(digitMatch[1], 10);
  } else {
    for (const [word, num] of Object.entries(WORD_NUMBERS)) {
      if (normalized.includes(word)) {
        quantity = num;
        break;
      }
    }
  }

  // Extract price: $XX.XX or XX USD
  const priceMatch = text.match(/\$\s?(\d+(?:\.\d{2})?)/i) || 
                    text.match(/(\d+(?:\.\d{2})?)\s?(?:usd|dollars?)/i);
  if (priceMatch) {
    price = `$${priceMatch[1]}`;
  }

  // Extract attributes (modifiers)
  for (const token of tokens) {
    if (MODIFIER_KEYWORDS.includes(token)) {
      attributes.push(token);
    }
  }

  // Extract product candidate: remove stop words, numbers, prices, keywords
  const tokensToRemove = new Set([
    ...STOP_WORDS,
    ...PURCHASE_KEYWORDS,
    ...INQUIRY_KEYWORDS,
    ...Object.keys(WORD_NUMBERS)
  ]);
  
  // Also remove quantity digits and price patterns
  const cleanedText = normalized
    .replace(/\$\s?\d+(?:\.\d{2})?/g, '')
    .replace(/\d+/g, '');
  
  const productTokens = cleanedText
    .split(' ')
    .filter(t => t.length > 2 && !tokensToRemove.has(t));
  
  const productCandidate = productTokens.length > 0 
    ? productTokens.join(' ')
    : null;

  return {
    quantity,
    price,
    attributes,
    productCandidate,
    originalText: text
  };
}

// ============================================================================
// MAIN PARSER PIPELINE
// ============================================================================

export interface ParsedIntent {
  originalText: string;
  normalized: string;
  tokens: string[];
  intent: {
    score: number;
    type: 'purchase' | 'inquiry' | 'unknown';
    keywords: string[];
  };
  entities: ExtractedEntities;
}

/**
 * Full parsing pipeline (Stages 1-4)
 */
export function parseMessage(text: string): ParsedIntent {
  const normalized = normalize(text);
  const tokens = tokenize(text);
  const intent = classifyIntent(tokens);
  const entities = extractEntities(text);

  return {
    originalText: text,
    normalized,
    tokens,
    intent,
    entities
  };
}
