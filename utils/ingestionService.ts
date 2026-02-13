/**
 * Ingestion Engine - High-Performance Catalog Indexing
 * Transforms raw product data into searchable LookupIndex
 */

import type { Product, ProductVariant } from '../types/products';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this',
  'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'about', 'into', 'over', 'after', 'before', 'between'
]);

const PUNCTUATION_REGEX = /[^\w\s]/g;

export function normalize(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(PUNCTUATION_REGEX, '')
    .trim();
  
  const tokens = cleaned.split(/\s+/).filter(token => token.length > 0);
  const filtered = tokens.filter(token => !STOP_WORDS.has(token));
  
  return filtered;
}

export function generateBigrams(tokens: string[]): string[] {
  if (tokens.length < 2) return [];
  
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  
  return bigrams;
}

export interface LookupIndex {
  tokenMap: Record<string, string[]>;
  bigramMap: Record<string, string[]>;
  attributeMap: Record<string, string[]>;
  productCount: number;
  variantCount: number;
  lastIndexedAt: string;
}

export interface ProcessedProduct {
  product: Product;
  tokens: string[];
  bigrams: string[];
  variantAttributes: Map<string, string[]>;
}

export function extractVariantAttributes(variant: ProductVariant): Map<string, string[]> {
  const attributes = new Map<string, string[]>();
  
  const titleParts: string[] = [];
  if (variant.options) {
    for (const opt of variant.options) {
      const value = opt.value.toLowerCase().trim();
      if (value) {
        titleParts.push(value);
        const normalizedValue = normalize(opt.value).join(' ');
        if (normalizedValue) {
          const existing = attributes.get(opt.name.toLowerCase()) || [];
          existing.push(normalizedValue);
          attributes.set(opt.name.toLowerCase(), existing);
        }
      }
    }
  }
  
  const fullTitle = titleParts.join(' / ');
  const titleTokens = normalize(fullTitle);
  
  const colorKeywords = ['red', 'blue', 'green', 'black', 'white', 'pink', 'purple', 'yellow', 'orange', 'brown', 'gray', 'grey', 'navy', 'beige', 'gold', 'silver', 'cream', 'teal', 'magenta', 'cyan'];
  const sizeKeywords = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large', 'x-small', 'x-large'];
  
  for (const token of titleTokens) {
    if (colorKeywords.includes(token)) {
      const existing = attributes.get('color') || [];
      if (!existing.includes(token)) existing.push(token);
      attributes.set('color', existing);
    }
    if (sizeKeywords.includes(token)) {
      const existing = attributes.get('size') || [];
      if (!existing.includes(token)) existing.push(token);
      attributes.set('size', existing);
    }
  }
  
  return attributes;
}

export function buildLookupIndex(products: Product[]): LookupIndex {
  const tokenMap: Record<string, string[]> = {};
  const bigramMap: Record<string, string[]> = {};
  const attributeMap: Record<string, string[]> = {};
  
  let variantCount = 0;
  
  for (const product of products) {
    const tokens = normalize(product.name);
    const bigrams = generateBigrams(tokens);
    
    for (const token of tokens) {
      if (!tokenMap[token]) tokenMap[token] = [];
      if (!tokenMap[token].includes(product.id)) {
        tokenMap[token].push(product.id);
      }
    }
    
    for (const bigram of bigrams) {
      if (!bigramMap[bigram]) bigramMap[bigram] = [];
      if (!bigramMap[bigram].includes(product.id)) {
        bigramMap[bigram].push(product.id);
      }
    }
    
    if (product.variants) {
      for (const variant of product.variants) {
        variantCount++;
        const attrs = extractVariantAttributes(variant);
        
        for (const [attrType, values] of attrs.entries()) {
          for (const value of values) {
            const key = `${attrType}:${value}`;
            if (!attributeMap[key]) attributeMap[key] = [];
            if (!attributeMap[key].includes(variant.id)) {
              attributeMap[key].push(variant.id);
            }
          }
        }
      }
    }
  }
  
  return {
    tokenMap,
    bigramMap,
    attributeMap,
    productCount: products.length,
    variantCount,
    lastIndexedAt: new Date().toISOString()
  };
}

export interface IngestionResult {
  success: boolean;
  products: Product[];
  index: LookupIndex;
  processedAt: string;
  errors: string[];
}

export async function ingestCatalog(rawProducts: Product[]): Promise<IngestionResult> {
  const errors: string[] = [];
  
  const validProducts: Product[] = [];
  
  for (let i = 0; i < rawProducts.length; i++) {
    const raw = rawProducts[i];
    
    if (!raw.name || !raw.name.trim()) {
      errors.push(`Product at index ${i}: Missing name`);
      continue;
    }
    
    const product: Product = {
      ...raw,
      id: raw.id || `prod_${Date.now()}_${i}`,
      name: raw.name.trim(),
      search_string: normalize(raw.name).join(' '),
      source: raw.source || 'manual',
      is_active: raw.is_active !== false,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      variants: raw.variants?.map((v, idx) => ({
        ...v,
        id: v.id || `var_${Date.now()}_${i}_${idx}`,
        sku: v.sku || `${raw.sku || raw.id}_${idx}`,
        options: v.options || [],
        price: v.price ?? raw.price ?? 0,
        inventory_quantity: v.inventory_quantity ?? 0,
        is_active: v.is_active !== false
      }))
    };
    
    validProducts.push(product);
  }
  
  const index = buildLookupIndex(validProducts);
  
  const result: IngestionResult = {
    success: errors.length === 0,
    products: validProducts,
    index,
    processedAt: new Date().toISOString(),
    errors
  };
  
  await saveToStorage(result);
  
  return result;
}

export async function saveToStorage(ingestionResult: IngestionResult): Promise<void> {
  const storageKey = 'ordersync_catalog_index';
  
  const storageData = {
    products: ingestionResult.products,
    index: ingestionResult.index,
    lastUpdated: ingestionResult.processedAt
  };
  
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [storageKey]: storageData });
  } else if (typeof localStorage !== 'undefined') {
    localStorage.setItem(storageKey, JSON.stringify(storageData));
  }
}

export async function loadFromStorage(): Promise<{ products: Product[]; index: LookupIndex } | null> {
  const storageKey = 'ordersync_catalog_index';
  
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const result = await chrome.storage.local.get(storageKey);
    return result[storageKey] || null;
  } else if (typeof localStorage !== 'undefined') {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  }
  
  return null;
}

export async function clearCatalogStorage(): Promise<void> {
  const storageKey = 'ordersync_catalog_index';
  
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.remove(storageKey);
  } else if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(storageKey);
  }
}

export function searchIndex(
  query: string,
  index: LookupIndex,
  products: Product[]
): Product[] {
  const queryTokens = normalize(query);
  const queryBigrams = generateBigrams(queryTokens);
  
  const candidateScores = new Map<string, number>();
  
  for (const token of queryTokens) {
    if (index.tokenMap[token]) {
      for (const productId of index.tokenMap[token]) {
        candidateScores.set(productId, (candidateScores.get(productId) || 0) + 1);
      }
    }
  }
  
  for (const bigram of queryBigrams) {
    if (index.bigramMap[bigram]) {
      for (const productId of index.bigramMap[bigram]) {
        candidateScores.set(productId, (candidateScores.get(productId) || 0) + 2);
      }
    }
  }
  
  const colorMatch = queryTokens.find(t => 
    Object.keys(index.attributeMap).some(k => k.startsWith('color:') && k.includes(t))
  );
  if (colorMatch) {
    const colorKey = Object.keys(index.attributeMap).find(k => k.startsWith('color:') && k.includes(colorMatch));
    if (colorKey && index.attributeMap[colorKey]) {
      for (const variantId of index.attributeMap[colorKey]) {
        const product = products.find(p => p.variants?.some(v => v.id === variantId));
        if (product) {
          candidateScores.set(product.id, (candidateScores.get(product.id) || 0) + 3);
        }
      }
    }
  }
  
  const sortedCandidates = Array.from(candidateScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  return sortedCandidates
    .map(([id]) => products.find(p => p.id === id))
    .filter((p): p is Product => p !== undefined);
}
