/**
 * Product Matcher & Cart Link Generator
 * Uses Fuse.js for fuzzy matching and generates platform-specific cart links
 */

import Fuse from 'fuse.js'
import { PRODUCTS, Product } from './products'

export interface ProductMatch extends Product {
  score?: number
  matchedVariant?: string
}

export interface ExtractedOrder {
  product: string
  variant: string | null
  quantity: number
}

// Fuse.js configuration for fuzzy matching
const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.6 },
    { name: 'sku', weight: 0.3 },
    { name: 'variant_options.sizes', weight: 0.05 },
    { name: 'variant_options.colors', weight: 0.05 }
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2
}

// Initialize Fuse instance
const fuse = new Fuse(PRODUCTS, FUSE_OPTIONS)

/**
 * Find best product match using fuzzy matching
 * Score based on: Product Name (60%) + Variant/Size (40%)
 * 
 * @param extractedOrder - The parsed order from customer message
 * @returns ProductMatch or null if score < 0.7
 */
export function findBestMatch(extractedOrder: ExtractedOrder): ProductMatch | null {
  const { product, variant, quantity } = extractedOrder
  
  if (!product || product === 'unknown') {
    return null
  }

  // Search using Fuse.js
  const searchTerm = variant 
    ? `${product} ${variant}` 
    : product
  
  const results = fuse.search(searchTerm)
  
  if (results.length === 0) {
    return null
  }

  // Get top match
  const topMatch = results[0]
  const matchScore = 1 - (topMatch.score || 0)
  
  // Only return if score > 0.7
  if (matchScore < 0.7) {
    console.log(`Match score ${matchScore} below threshold for: ${product}`)
    return null
  }

  // Check variant compatibility
  const matchedProduct = topMatch.item
  let matchedVariant: string | undefined
  
  if (variant && matchedProduct.variant_options) {
    const { sizes, colors } = matchedProduct.variant_options
    
    // Check if extracted variant matches available options
    const normalizedVariant = variant.toLowerCase()
    
    const sizeMatch = sizes?.find(s => 
      normalizedVariant.includes(s.toLowerCase()) ||
      normalizedVariant.includes(s.toLowerCase().replace('small', 's').replace('medium', 'm').replace('large', 'l'))
    )
    
    const colorMatch = colors?.find(c => 
      normalizedVariant.includes(c.toLowerCase())
    )
    
    if (sizeMatch || colorMatch) {
      matchedVariant = [colorMatch, sizeMatch].filter(Boolean).join(' ')
    }
  }

  return {
    ...matchedProduct,
    score: matchScore,
    matchedVariant
  }
}

/**
 * Generate cart link based on platform
 * 
 * @param match - The matched product
 * @param qty - Quantity to add to cart
 * @param platform - 'shopify' | 'stripe' | 'generic' (default: generic)
 * @returns Generated cart/checkout URL
 */
export function generateCartLink(
  match: ProductMatch, 
  qty: number = 1, 
  platform: 'shopify' | 'stripe' | 'generic' = 'generic'
): string {
  const storeUrl = import.meta.env.VITE_STORE_URL || 'https://your-store.com'
  
  switch (platform) {
    case 'shopify':
      // Shopify cart format: /cart/{variant_id}:{quantity}
      return `${storeUrl}/cart/${match.variant_id || match.id}:${qty}`
    
    case 'stripe':
      // Stripe Checkout format with price ID
      if (match.stripe_price_id) {
        return `https://checkout.stripe.com/pay/${match.stripe_price_id}?quantity=${qty}`
      }
      // Fallback to generic if no Stripe price ID
      return generateGenericLink(match, qty, storeUrl)
    
    case 'generic':
    default:
      return generateGenericLink(match, qty, storeUrl)
  }
}

/**
 * Generate generic cart link
 */
function generateGenericLink(match: ProductMatch, qty: number, storeUrl: string): string {
  const params = new URLSearchParams({
    sku: match.sku,
    q: qty.toString(),
    product: match.name
  })
  
  if (match.matchedVariant) {
    params.set('variant', match.matchedVariant)
  }
  
  return `${storeUrl}/checkout?${params.toString()}`
}

/**
 * Get all products (for admin/debugging)
 */
export function getAllProducts(): Product[] {
  return PRODUCTS
}

/**
 * Search products by name
 */
export function searchProducts(query: string): Product[] {
  if (!query || query.length < 2) return []
  
  const results = fuse.search(query)
  return results.map(r => r.item)
}

/**
 * Get product by SKU
 */
export function getProductBySku(sku: string): Product | undefined {
  return PRODUCTS.find(p => p.sku.toLowerCase() === sku.toLowerCase())
}

/**
 * Get product by ID
 */
export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}

export default {
  findBestMatch,
  generateCartLink,
  getAllProducts,
  searchProducts,
  getProductBySku,
  getProductById
}
