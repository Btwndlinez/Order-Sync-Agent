/**
 * Product Types for Hybrid Product Hub
 * Supports Manual, CSV, and Shopify data sources
 */

export type ProductSource = 'manual' | 'csv' | 'shopify';

export interface ProductVariant {
  id: string;
  external_id?: string;
  sku: string;
  price: number;
  options: { name: string; value: string }[];
  inventory_quantity: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  seller_id?: string;
  source: ProductSource;
  external_id?: string;
  name: string;
  sku: string;
  price: number;
  attributes: Record<string, any>;
  search_string: string;
  image_url?: string;
  is_active: boolean;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

/**
 * Canonical Product Model - Internal Source of Truth
 * All incoming data maps to this structure
 */
export interface CanonicalProduct {
  id: string;
  title: string;
  source: ProductSource;
  variants: {
    id: string;
    sku: string;
    price: number;
    options: { name: string; value: string }[];
  }[];
}

export interface ProductImportJob {
  id: string;
  seller_id: string;
  source: 'csv' | 'shopify';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  error_log: any[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface CSVParsedRow {
  Title?: string;
  title?: string;
  Name?: string;
  name?: string;
  SKU?: string;
  sku?: string;
  Price?: string | number;
  price?: string | number;
  [key: string]: any;
}

export interface CSVImportResult {
  success: boolean;
  products: Partial<Product>[];
  errors: { row: number; message: string }[];
  totalRows: number;
  importedRows: number;
}
