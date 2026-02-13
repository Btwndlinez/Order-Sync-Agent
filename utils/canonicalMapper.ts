/**
 * Canonical Product Model Mapper
 * Converts all incoming data sources to internal Product structure
 */

import type { 
  Product, 
  ProductSource, 
  CanonicalProduct, 
  CSVParsedRow
} from '../types/products';

/**
 * Maps any incoming product data to Canonical Product Model
 * This is the single source of truth transformation
 */
export const mapToCanonicalProduct = (
  data: any,
  source: ProductSource
): CanonicalProduct => {
  switch (source) {
    case 'csv':
      return mapCSVToCanonical(data);
    case 'shopify':
      return mapShopifyToCanonical(data);
    case 'manual':
      return mapManualToCanonical(data);
    default:
      throw new Error(`Unknown source type: ${source}`);
  }
};

/**
 * Maps CSV row to Canonical Product
 */
const mapCSVToCanonical = (row: CSVParsedRow): CanonicalProduct => {
  const name = row.Title || row.title || row.Name || row.name || '';
  const sku = row.SKU || row.sku || '';
  const price = parseFloat(String(row.Price || row.price || 0)) || 0;

  return {
    id: `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: name,
    source: 'csv',
    variants: [{
      id: `variant_${sku}`,
      sku: sku,
      price: price,
      options: []
    }]
  };
};

/**
 * Maps Shopify product data to Canonical Product
 */
const mapShopifyToCanonical = (shopifyProduct: any): CanonicalProduct => {
  // Handle Shopify's nested variant structure
  const variants = shopifyProduct.variants?.map((v: any) => ({
    id: v.id?.toString() || '',
    sku: v.sku || '',
    price: parseFloat(v.price) || 0,
    options: v.option_values?.map((opt: any) => ({
      name: opt.name,
      value: opt.value
    })) || []
  })) || [];

  // If no variants, create one from product-level data
  if (variants.length === 0) {
    variants.push({
      id: shopifyProduct.id?.toString() || '',
      sku: shopifyProduct.variants?.[0]?.sku || '',
      price: parseFloat(shopifyProduct.variants?.[0]?.price) || 0,
      options: []
    });
  }

  return {
    id: shopifyProduct.id?.toString() || '',
    title: shopifyProduct.title || '',
    source: 'shopify',
    variants
  };
};

/**
 * Maps manual product entry to Canonical Product
 */
const mapManualToCanonical = (manualProduct: Partial<Product>): CanonicalProduct => {
  return {
    id: manualProduct.id || `manual_${Date.now()}`,
    title: manualProduct.name || '',
    source: 'manual',
    variants: [{
      id: manualProduct.id || `variant_${manualProduct.sku}`,
      sku: manualProduct.sku || '',
      price: manualProduct.price || 0,
      options: []
    }]
  };
};

/**
 * Converts Canonical Product to internal Product structure
 * Generates search string for fuzzy matching
 */
export const canonicalToProduct = (
  canonical: CanonicalProduct,
  sellerId?: string
): Partial<Product> => {
  const primaryVariant = canonical.variants[0] || {
    id: '',
    sku: '',
    price: 0,
    options: []
  };

  // Generate search string including all variant SKUs and options
  const variantStrings = canonical.variants.map(v => 
    `${v.sku} ${v.options.map(o => o.value).join(' ')}`
  );
  
  const searchString = `${canonical.title} ${primaryVariant.sku} ${variantStrings.join(' ')}`.toLowerCase();

  return {
    seller_id: sellerId,
    source: canonical.source,
    external_id: canonical.source === 'shopify' ? canonical.id : undefined,
    name: canonical.title,
    sku: primaryVariant.sku,
    price: primaryVariant.price,
    attributes: {
      variants: canonical.variants.map(v => ({
        sku: v.sku,
        price: v.price,
        options: v.options
      }))
    },
    search_string: searchString,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

/**
 * Batch convert multiple products to canonical format
 */
export const mapToCanonicalBatch = (
  items: any[],
  source: ProductSource
): CanonicalProduct[] => {
  return items
    .map(item => {
      try {
        return mapToCanonicalProduct(item, source);
      } catch (error) {
        console.error('Failed to map product:', error);
        return null;
      }
    })
    .filter((item): item is CanonicalProduct => item !== null);
};

/**
 * Generate search string for fuzzy matching
 * Combines title, SKU, and all variant information
 */
export const generateSearchString = (product: CanonicalProduct): string => {
  const parts = [product.title];
  
  product.variants.forEach(variant => {
    parts.push(variant.sku);
    variant.options.forEach(option => {
      parts.push(option.value);
    });
  });
  
  return parts.join(' ').toLowerCase();
};

/**
 * Merges duplicate products based on SKU
 * Useful when importing from multiple sources
 */
export const mergeDuplicateProducts = (
  products: CanonicalProduct[]
): CanonicalProduct[] => {
  const skuMap = new Map<string, CanonicalProduct>();
  
  products.forEach(product => {
    const primarySku = product.variants[0]?.sku;
    if (!primarySku) return;
    
    if (skuMap.has(primarySku)) {
      // Merge variants if product already exists
      const existing = skuMap.get(primarySku)!;
      existing.variants = [...existing.variants, ...product.variants];
    } else {
      skuMap.set(primarySku, product);
    }
  });
  
  return Array.from(skuMap.values());
};
