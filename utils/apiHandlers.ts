/**
 * Mock API Handlers
 * Simulates AI analysis endpoints for Channel Assist
 */

import type { Product } from '../types/products';
import type { ProductSuggestion } from '../hooks/useStore';

/**
 * Analyze message and return suggestions
 * Simulates AI processing with 800ms delay
 */
export async function analyzeMessage(
  message: string,
  products: Product[]
): Promise<ProductSuggestion[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const lowerMessage = message.toLowerCase();
  const suggestions: ProductSuggestion[] = [];

  // Extract quantity
  let quantity = 1;
  const qtyMatch = lowerMessage.match(/(\d+)\s*(x|pcs?|pieces?)?/);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1]) || 1;
  }

  // Extract variant (size/color)
  const sizes = ['xs', 's', 'small', 'm', 'medium', 'l', 'large', 'xl', 'xxl', 'xxxl'];
  const colors = ['red', 'blue', 'green', 'black', 'white', 'pink', 'purple', 'yellow', 'orange', 'navy'];
  
  let foundVariant: string | null = null;
  let matchedOn: string[] = [];

  for (const size of sizes) {
    if (lowerMessage.includes(size)) {
      foundVariant = size.toUpperCase();
      matchedOn.push(`size: ${size}`);
      break;
    }
  }

  if (!foundVariant) {
    for (const color of colors) {
      if (lowerMessage.includes(color)) {
        foundVariant = color.charAt(0).toUpperCase() + color.slice(1);
        matchedOn.push(`color: ${color}`);
        break;
      }
    }
  }

  // Search for matching products
  for (const product of products) {
    const searchText = `${product.name} ${product.sku} ${product.search_string || ''}`.toLowerCase();
    
    // Calculate confidence based on keyword matches
    const words = lowerMessage.split(/\s+/).filter((w) => w.length > 2);
    let matchScore = 0;
    const productMatches: string[] = [];

    for (const word of words) {
      if (searchText.includes(word)) {
        matchScore += 0.2;
        productMatches.push(word);
      }
    }

    // Boost score for variant match
    if (foundVariant) {
      matchScore += 0.3;
    }

    // Boost score for quantity > 1
    if (quantity > 1) {
      matchScore += 0.1;
    }

    // Calculate final confidence
    const confidence = Math.min(matchScore, 1);

    // Only include if confidence > 0.2
    if (confidence > 0.2) {
      suggestions.push({
        id: `suggestion_${product.id}`,
        product,
        variant: foundVariant,
        quantity,
        confidence,
        matchedOn: matchedOn.concat(productMatches),
      });
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  // Return top 3 suggestions
  return suggestions.slice(0, 3);
}

/**
 * Generate checkout link for a product
 */
export function generateCheckoutLink(
  product: Product,
  quantity: number = 1,
  variant: string | null = null
): string {
  const storeUrl = localStorage.getItem('channel_assist_store_url') || 'https://your-store.com';
  
  // Build cart URL based on platform
  let link = `${storeUrl}/cart/`;
  
  if (product.external_id) {
    link += `${product.external_id}:${quantity}`;
  } else {
    link += `${product.sku}:${quantity}`;
  }

  // Add variant if available
  if (variant) {
    link += `?variant=${encodeURIComponent(variant)}`;
  }

  return link;
}

/**
 * Check if user has exceeded usage limits
 */
export function checkUsageLimit(usageCount: number, planTier: string): {
  allowed: boolean;
  remaining: number;
  message?: string;
} {
  const limits: Record<string, number> = {
    free: 10,
    pro: 100,
    enterprise: Infinity,
  };

  const limit = limits[planTier] || 10;
  const remaining = limit - usageCount;

  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      message: planTier === 'free' 
        ? 'Free tier limit reached. Upgrade to Pro for unlimited usage.'
        : 'Usage limit reached.',
    };
  }

  return { allowed: true, remaining };
}

/**
 * Get mock products for demo/testing
 */
export function getMockProducts(): Product[] {
  return [
    {
      id: 'prod_1',
      source: 'manual',
      name: 'Vintage Denim Jacket',
      sku: 'VDJ-001',
      price: 125.0,
      attributes: { colors: ['Blue', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
      search_string: 'vintage denim jacket vdj-001 blue black',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_2',
      source: 'manual',
      name: 'Classic White Tee',
      sku: 'CWT-002',
      price: 35.0,
      attributes: { colors: ['White'], sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
      search_string: 'classic white tee cwt-002 white',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_3',
      source: 'manual',
      name: 'Leather Crossbody Bag',
      sku: 'LCB-003',
      price: 89.0,
      attributes: { colors: ['Brown', 'Black'], sizes: [] },
      search_string: 'leather crossbody bag lcb-003 brown black',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_4',
      source: 'csv',
      name: 'Gold Hoop Earrings',
      sku: 'GHE-004',
      price: 45.0,
      attributes: { colors: ['Gold', 'Silver'], sizes: [] },
      search_string: 'gold hoop earrings ghe-004 gold silver',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod_5',
      source: 'manual',
      name: 'Wool Blend Sweater',
      sku: 'WBS-005',
      price: 75.0,
      attributes: { colors: ['Gray', 'Navy', 'Burgundy'], sizes: ['S', 'M', 'L'] },
      search_string: 'wool blend sweater wbs-005 gray navy burgundy',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
