/**
 * Vector Search Integration
 * Uses OpenAI embeddings for semantic product search
 */

import type { Product } from '../types/products';

interface VectorSearchConfig {
  openaiApiKey: string;
  supabaseClient?: any;
  embeddingModel?: string;
}

interface SearchResult {
  product: Product;
  score: number;
}

export class VectorSearchEngine {
  private config: VectorSearchConfig;
  private embeddingModel: string;
  private cache: Map<string, number[]> = new Map();

  constructor(config: VectorSearchConfig) {
    this.config = config;
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    // Cache the embedding
    this.cache.set(cacheKey, embedding);

    return embedding;
  }

  async generateProductEmbedding(product: Product): Promise<number[]> {
    // Create search string from product
    const searchText = this.createSearchText(product);
    return this.generateEmbedding(searchText);
  }

  createSearchText(product: Product): string {
    const parts = [product.name, product.sku];
    
    // Add variant info if available
    if (product.attributes?.variants) {
      for (const variant of product.attributes.variants) {
        parts.push(variant.sku);
        if (variant.options) {
          for (const opt of variant.options) {
            parts.push(opt.value);
          }
        }
      }
    }

    return parts.join(' ').toLowerCase();
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async searchProducts(
    products: Product[],
    query: string,
    options: {
      threshold?: number;
      limit?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const { threshold = 0.7, limit = 10 } = options;

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Calculate similarities
    const results: SearchResult[] = [];

    for (const product of products) {
      try {
        const productEmbedding = await this.generateProductEmbedding(product);
        const score = this.cosineSimilarity(queryEmbedding, productEmbedding);

        if (score >= threshold) {
          results.push({ product, score });
        }
      } catch (error) {
        console.error(`Failed to embed product ${product.id}:`, error);
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  // Simple fuzzy search fallback (when embeddings fail)
  fuzzySearch(products: Product[], query: string): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/);

    const results: SearchResult[] = [];

    for (const product of products) {
      const searchText = product.search_string?.toLowerCase() || 
        `${product.name} ${product.sku}`.toLowerCase();

      // Count matching words
      let matchCount = 0;
      for (const word of queryWords) {
        if (word.length >= 2 && searchText.includes(word)) {
          matchCount++;
        }
      }

      // Calculate simple score based on word matches
      const score = matchCount / queryWords.length;

      if (score > 0) {
        results.push({ product, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

let searchEngine: VectorSearchEngine | null = null;

export function initializeVectorSearch(config: VectorSearchConfig): VectorSearchEngine {
  searchEngine = new VectorSearchEngine(config);
  return searchEngine;
}

export function getVectorSearch(): VectorSearchEngine | null {
  return searchEngine;
}

export async function searchProducts(
  products: Product[],
  query: string,
  options: {
    useVector?: boolean;
    threshold?: number;
    limit?: number;
  } = {}
): Promise<SearchResult[]> {
  const { useVector = true, threshold = 0.7, limit = 10 } = options;

  // Try vector search first
  if (useVector && searchEngine) {
    try {
      return await searchEngine.searchProducts(products, query, { threshold, limit });
    } catch (error) {
      console.warn('Vector search failed, falling back to fuzzy search:', error);
    }
  }

  // Fallback to fuzzy search
  if (searchEngine) {
    return searchEngine.fuzzySearch(products, query);
  }

  // Simple fallback without engine
  const lowerQuery = query.toLowerCase();
  return products
    .filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku.toLowerCase().includes(lowerQuery) ||
      p.search_string?.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit)
    .map(p => ({ product: p, score: 1 }));
}
