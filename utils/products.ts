/**
 * Product Database
 * Mock products for Phase 1 implementation
 */

export interface Product {
  id: string
  name: string
  sku: string
  price: string
  variant_options: {
    sizes?: string[]
    colors?: string[]
  }
  variant_id?: string
  stripe_price_id?: string
}

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Vintage Leather Camera Bag',
    sku: 'VLCB-001',
    price: '$125.00',
    variant_options: {
      colors: ['Brown', 'Black', 'Tan']
    },
    variant_id: '40012345678901',
    stripe_price_id: 'price_1234567890'
  },
  {
    id: '2',
    name: 'Vintage Tee',
    sku: 'VTEE-002',
    price: '$35.00',
    variant_options: {
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Red', 'Blue', 'White', 'Black', 'Navy']
    },
    variant_id: '40012345678902',
    stripe_price_id: 'price_1234567891'
  },
  {
    id: '3',
    name: 'Canvas Messenger Bag',
    sku: 'CMB-003',
    price: '$85.00',
    variant_options: {
      colors: ['Olive', 'Charcoal', 'Beige']
    },
    variant_id: '40012345678903',
    stripe_price_id: 'price_1234567892'
  },
  {
    id: '4',
    name: 'Leather Wallet',
    sku: 'LW-004',
    price: '$55.00',
    variant_options: {
      colors: ['Brown', 'Black', 'Tan']
    },
    variant_id: '40012345678904',
    stripe_price_id: 'price_1234567893'
  },
  {
    id: '5',
    name: 'Denim Jacket',
    sku: 'DJ-005',
    price: '$95.00',
    variant_options: {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Blue', 'Black', 'Light Blue']
    },
    variant_id: '40012345678905',
    stripe_price_id: 'price_1234567894'
  },
  {
    id: '6',
    name: 'Baseball Cap',
    sku: 'BC-006',
    price: '$28.00',
    variant_options: {
      colors: ['Navy', 'Black', 'White', 'Red']
    },
    variant_id: '40012345678906',
    stripe_price_id: 'price_1234567895'
  },
  {
    id: '7',
    name: 'Graphic Hoodie',
    sku: 'GH-007',
    price: '$65.00',
    variant_options: {
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'Grey', 'Navy']
    },
    variant_id: '40012345678907',
    stripe_price_id: 'price_1234567896'
  },
  {
    id: '8',
    name: 'Beanie Hat',
    sku: 'BH-008',
    price: '$22.00',
    variant_options: {
      colors: ['Black', 'Grey', 'Navy', 'Burgundy']
    },
    variant_id: '40012345678908',
    stripe_price_id: 'price_1234567897'
  }
]

export default PRODUCTS
