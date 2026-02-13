/**
 * Shopify Sync Utility
 * Handles product syncing from Shopify stores
 */

import type { Product, CanonicalProduct } from '../types/products';
import { mapToCanonicalProduct } from '../utils/canonicalMapper';

interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  tags: string;
  created_at: string;
  updated_at: string;
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  inventory_quantity: number;
  inventory_policy: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  weight: number;
  weight_unit: string;
}

interface ShopifyImage {
  id: number;
  src: string;
  position: number;
}

export class ShopifySync {
  private config: ShopifyConfig;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.config = config;
    this.baseUrl = `https://${config.shopDomain}/admin/api/2024-01`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.config.accessToken,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async fetchProducts(limit: number = 250, sinceId?: number): Promise<ShopifyProduct[]> {
    let endpoint = `/products.json?limit=${limit}`;
    if (sinceId) {
      endpoint += `&since_id=${sinceId}`;
    }

    const data = await this.request<{ products: ShopifyProduct[] }>(endpoint);
    return data.products;
  }

  async fetchAllProducts(): Promise<ShopifyProduct[]> {
    const allProducts: ShopifyProduct[] = [];
    let sinceId = 0;

    while (true) {
      const products = await this.fetchProducts(250, sinceId);
      
      if (products.length === 0) break;
      
      allProducts.push(...products);
      sinceId = products[products.length - 1].id;

      if (products.length < 250) break;
    }

    return allProducts;
  }

  mapToCanonical(shopifyProduct: ShopifyProduct): CanonicalProduct {
    return mapToCanonicalProduct(shopifyProduct, 'shopify');
  }

  async syncProducts(
    onProgress?: (current: number, total: number, product: ShopifyProduct) => void
  ): Promise<{ added: number; updated: number; errors: string[] }> {
    const shopifyProducts = await this.fetchAllProducts();
    const errors: string[] = [];
    let added = 0;
    let updated = 0;

    for (let i = 0; i < shopifyProducts.length; i++) {
      const product = shopifyProducts[i];
      
      try {
        const canonical = this.mapToCanonical(product);
        
        if (onProgress) {
          onProgress(i + 1, shopifyProducts.length, product);
        }

        // Map to internal product format
        this.canonicalToProduct(canonical);
        
        added++;
      } catch (error) {
        errors.push(`Product ${product.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { added, updated, errors };
  }

  canonicalToProduct(canonical: CanonicalProduct): Partial<Product> {
    const primaryVariant = canonical.variants[0] || {
      id: '',
      sku: '',
      price: 0,
      options: []
    };

    const variantStrings = canonical.variants.map(v => 
      `${v.sku} ${v.options.map(o => o.value).join(' ')}`
    );
    
    const searchString = `${canonical.title} ${primaryVariant.sku} ${variantStrings.join(' ')}`.toLowerCase();

    return {
      source: 'shopify',
      external_id: canonical.id,
      name: canonical.title,
      sku: primaryVariant.sku,
      price: primaryVariant.price,
      attributes: {
        variants: canonical.variants.map(v => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
          options: v.options
        }))
      },
      search_string: searchString,
      is_active: true,
      last_synced_at: new Date().toISOString()
    };
  }
}

export async function createShopifySync(config: ShopifyConfig): Promise<ShopifySync> {
  return new ShopifySync(config);
}

export function validateShopifyConfig(config: Partial<ShopifyConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.shopDomain) {
    errors.push('Shop domain is required');
  } else if (!config.shopDomain.includes('.myshopify.com') && !config.shopDomain.includes('shopify.com')) {
    errors.push('Invalid Shopify domain format');
  }

  if (!config.accessToken) {
    errors.push('Access token is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
