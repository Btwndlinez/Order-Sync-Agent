/**
 * CSV Parser for Product Imports
 * Uses Papa Parse for robust CSV handling
 */

import type { CSVParsedRow, CSVImportResult, Product } from '../types/products';

// Papa Parse CDN import for browser environments
const loadPapaParse = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Papa Parse requires browser environment'));
      return;
    }
    
    // @ts-ignore
    if (window.Papa) {
      // @ts-ignore
      resolve(window.Papa);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';
    script.onload = () => {
      // @ts-ignore
      resolve(window.Papa);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * Parse CSV file into product data
 */
export const parseCSVFile = async (
  file: File,
  sellerId?: string
): Promise<CSVImportResult> => {
  try {
    const Papa = await loadPapaParse();
    
    return new Promise((resolve, reject) => {
      const products: Partial<Product>[] = [];
      const errors: { row: number; message: string }[] = [];
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        step: (results: any) => {
          const row = results.data as CSVParsedRow;
          const rowNumber = results.meta.cursor;
          
          try {
            const mappedProduct = mapCSVRowToProduct(row, sellerId);
            if (mappedProduct) {
              products.push(mappedProduct);
            }
          } catch (error) {
            errors.push({
              row: rowNumber,
              message: error instanceof Error ? error.message : 'Invalid row data'
            });
          }
        },
        complete: () => {
          resolve({
            success: errors.length === 0,
            products,
            errors,
            totalRows: products.length + errors.length,
            importedRows: products.length
          });
        },
        error: (error: any) => {
          reject({
            success: false,
            products: [],
            errors: [{ row: 0, message: error.message }],
            totalRows: 0,
            importedRows: 0
          });
        }
      });
    });
  } catch (error) {
    return {
      success: false,
      products: [],
      errors: [{ 
        row: 0, 
        message: error instanceof Error ? error.message : 'Failed to load CSV parser' 
      }],
      totalRows: 0,
      importedRows: 0
    };
  }
};

/**
 * Map CSV row to Product structure
 * Flexible column mapping for common CSV formats
 */
const mapCSVRowToProduct = (
  row: CSVParsedRow,
  sellerId?: string
): Partial<Product> | null => {
  // Extract fields with flexible column names
  const name = row.Title || row.title || row.Name || row.name || '';
  const sku = row.SKU || row.sku || row.Sku || '';
  let price = row.Price || row.price || row['Unit Price'] || row['unit_price'] || 0;
  
  // Validate required fields
  if (!name.trim() || !sku.trim()) {
    throw new Error('Missing required fields: Title/Name and SKU are required');
  }
  
  // Parse price - handle string or number
  let parsedPrice = 0;
  if (typeof price === 'string') {
    // Remove currency symbols and whitespace
    const cleanPrice = price.replace(/[$,\s]/g, '');
    parsedPrice = parseFloat(cleanPrice) || 0;
  } else if (typeof price === 'number') {
    parsedPrice = price;
  }
  
  // Generate search string for fuzzy matching
  const searchString = `${name} ${sku}`.toLowerCase();
  
  // Extract additional attributes from other columns
  const attributes: Record<string, any> = {};
  Object.keys(row).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (!['title', 'name', 'sku', 'price', 'unit price', 'unit_price'].includes(lowerKey)) {
      attributes[key] = row[key];
    }
  });
  
  return {
    seller_id: sellerId,
    source: 'csv' as const,
    name: name.trim(),
    sku: sku.trim(),
    price: parsedPrice,
    attributes,
    search_string: searchString,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

/**
 * Export products to CSV format
 */
export const exportProductsToCSV = (products: Product[]): string => {
  const headers = ['Title', 'SKU', 'Price', 'Source', 'Attributes'];
  
  const rows = products.map(product => [
    product.name,
    product.sku,
    product.price.toString(),
    product.source,
    JSON.stringify(product.attributes)
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Validate CSV structure
 */
export const validateCSVStructure = (headers: string[]): {
  valid: boolean;
  missing: string[];
  mapped: Record<string, string>;
} => {
  const required = ['title', 'sku', 'price'];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  const mapped: Record<string, string> = {};
  const missing: string[] = [];
  
  required.forEach(field => {
    const index = normalizedHeaders.findIndex(h => 
      h === field || 
      h === field.replace('_', ' ') ||
      (field === 'title' && h === 'name') ||
      (field === 'title' && h === 'product name')
    );
    
    if (index >= 0) {
      mapped[field] = headers[index];
    } else {
      missing.push(field);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing,
    mapped
  };
};

/**
 * Canonical field definitions with synonyms
 */
export const CANONICAL_FIELDS = {
  title: ['product', 'item', 'name', 'title', 'description', 'product name', 'product title', 'product_name', 'product_title'],
  sku: ['sku', 'id', 'code', 'identifier', 'ref', 'reference', 'sku code', 'sku_code', 'product id', 'product_id'],
  price: ['price', 'cost', 'amount', 'msrp', 'unit price', 'unit_price', 'selling price', 'selling_price', 'retail price', 'retail_price'],
  link: ['link', 'url', 'checkout', 'cart', 'checkout link', 'cart link', 'product link', 'product_url', 'buy link']
} as const;

export type CanonicalField = keyof typeof CANONICAL_FIELDS;

/**
 * Calculate string similarity (Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - (matrix[s1.length][s2.length] / maxLen);
}

/**
 * Auto-map CSV headers to canonical fields using fuzzy matching
 */
export const autoMapHeaders = (
  csvHeaders: string[],
  threshold: number = 0.6
): Record<CanonicalField, string | null> => {
  const mappings: Record<CanonicalField, string | null> = {
    title: null,
    sku: null,
    price: null,
    link: null
  };

  const availableHeaders = [...csvHeaders];

  const fieldEntries = Object.entries(CANONICAL_FIELDS) as [CanonicalField, readonly string[]][];
  
  for (const [canonicalField, synonyms] of fieldEntries) {
    let bestMatch: { header: string; score: number } | null = null;

    for (const csvHeader of availableHeaders) {
      const normalizedHeader = csvHeader.toLowerCase().trim();
      
      // Check exact match with synonyms first
      if ((synonyms as readonly string[]).includes(normalizedHeader)) {
        bestMatch = { header: csvHeader, score: 1 };
        break;
      }

      // Check fuzzy similarity
      for (const synonym of synonyms) {
        const score = calculateSimilarity(csvHeader, synonym);
        if (score > threshold && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { header: csvHeader, score };
        }
      }
    }

    if (bestMatch && bestMatch.score >= threshold) {
      mappings[canonicalField] = bestMatch.header;
    }
  }

  return mappings;
};

/**
 * Get mapping confidence for UI display
 */
export const getMappingConfidence = (
  canonicalField: CanonicalField,
  csvHeader: string | null
): { label: string; color: string } => {
  if (!csvHeader) {
    return { label: 'Not mapped', color: 'text-red-500' };
  }

  const synonyms = CANONICAL_FIELDS[canonicalField] as readonly string[];
  const normalizedHeader = csvHeader.toLowerCase().trim();

  if (synonyms.includes(normalizedHeader)) {
    return { label: 'Exact match', color: 'text-emerald-600' };
  }

  const score = Math.max(...synonyms.map(s => calculateSimilarity(csvHeader, s)));
  
  if (score >= 0.8) {
    return { label: 'High confidence', color: 'text-emerald-500' };
  } else if (score >= 0.6) {
    return { label: 'Medium confidence', color: 'text-amber-500' };
  }

  return { label: 'Low confidence', color: 'text-red-500' };
};
