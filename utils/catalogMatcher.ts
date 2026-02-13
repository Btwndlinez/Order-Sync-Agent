/**
 * Catalog Matcher - Stage 5: Fuzzy Matching
 * Matches parsed intent to products using Fuse.js
 */

import Fuse from 'fuse.js';
import type { ParsedIntent } from './parser';

export interface Product {
  id: string;
  title: string;
  sku: string;
  price: number;
  variants?: ProductVariant[];
  searchString?: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  options: { name: string; value: string }[];
}

export interface MatchResult {
  product: Product | null;
  variant: ProductVariant | null;
  confidence: number;
  needsConfirmation: boolean;
  matchScore: number;
  matchedOn: string[];
}

/**
 * Fuse.js configuration - the "sweet spot"
 */
const FUSE_OPTIONS: Fuse.IFuseOptions<Product> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'sku', weight: 0.3 },
    { name: 'searchString', weight: 0.2 }
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
  shouldSort: true
};

/**
 * Initialize Fuse with product catalog
 */
export function initializeMatcher(products: Product[]): Fuse<Product> {
  return new Fuse(products, FUSE_OPTIONS);
}

/**
 * Find best variant match within a product
 */
function findVariantMatch(
  product: Product, 
  attributes: string[]
): ProductVariant | null {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  const attributeSet = new Set(attributes.map(a => a.toLowerCase()));
  
  for (const variant of product.variants) {
    const variantText = [
      variant.title,
      variant.sku,
      ...variant.options.map(o => `${o.name} ${o.value}`)
    ].join(' ').toLowerCase();

    // Check if any attribute matches variant
    for (const attr of attributeSet) {
      if (variantText.includes(attr)) {
        return variant;
      }
    }
  }

  // Return first variant if no attribute match
  return product.variants[0] || null;
}

/**
 * Main matching function
 */
export function matchToCatalog(
  parsedIntent: ParsedIntent,
  fuseInstance: Fuse<Product>
): MatchResult {
  const { entities, intent } = parsedIntent;
  
  // Default response if no product candidate
  if (!entities.productCandidate) {
    return {
      product: null,
      variant: null,
      confidence: 0,
      needsConfirmation: true,
      matchScore: 0,
      matchedOn: []
    };
  }

  // Skip if intent score is too low
  if (intent.score < 0.2) {
    return {
      product: null,
      variant: null,
      confidence: 0,
      needsConfirmation: true,
      matchScore: 0,
      matchedOn: []
    };
  }

  // Run fuzzy search
  const searchResults = fuseInstance.search(entities.productCandidate);
  
  if (searchResults.length === 0) {
    return {
      product: null,
      variant: null,
      confidence: 0,
      needsConfirmation: true,
      matchScore: 0,
      matchedOn: []
    };
  }

  // Get best match
  const bestMatch = searchResults[0];
  const matchScore = bestMatch.score || 0;
  const confidence = 1 - matchScore;
  
  // Find variant if attributes extracted
  const variant = findVariantMatch(bestMatch.item, entities.attributes);

  // Determine if confirmation needed
  // Needs confirmation if confidence is between 0.6 and 0.8
  const needsConfirmation = confidence >= 0.6 && confidence < 0.8;

  // Track what we matched on
  const matchedOn: string[] = [];
  if (bestMatch.matches) {
    for (const match of bestMatch.matches) {
      if (match.key) matchedOn.push(match.key);
    }
  }

  return {
    product: bestMatch.item,
    variant,
    confidence,
    needsConfirmation,
    matchScore,
    matchedOn
  };
}

/**
 * Full pipeline: Parse + Match
 */
export function processMessage(
  text: string,
  fuseInstance: Fuse<Product>,
  parseFn: (text: string) => ParsedIntent = (t: string) => {
    // Lazy import to avoid circular deps
    const { parseMessage } = require('./parser');
    return parseMessage(t);
  }
): {
  parsed: ParsedIntent;
  match: MatchResult;
} {
  const parsed = parseFn(text);
  const match = matchToCatalog(parsed, fuseInstance);
  
  return { parsed, match };
}

/**
 * Generate checkout link from match
 */
export function generateCheckoutLink(
  match: MatchResult,
  quantity: number = 1,
  baseUrl: string = ''
): string | null {
  if (!match.product) return null;

  const variantId = match.variant?.id || match.product.id;
  const qty = quantity || 1;

  // Shopify-style cart link
  if (baseUrl.includes('shopify')) {
    return `${baseUrl}/cart/${variantId}:${qty}`;
  }

  // Stripe checkout
  if (baseUrl.includes('stripe')) {
    return `https://checkout.stripe.com/pay/${variantId}?quantity=${qty}`;
  }

  // Generic
  return `${baseUrl}/checkout?sku=${match.product.sku}&qty=${qty}`;
}
