/**
 * Product Store Hook
 * Manages hybrid product catalog with localStorage + Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductSource, CanonicalProduct } from '../types/products';
import { canonicalToProduct } from '../utils/canonicalMapper';

const LOCAL_STORAGE_KEY = 'channel_assist_products';

interface UseProductStoreOptions {
  sellerId?: string;
  supabaseClient?: any;
}

interface ProductStoreState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

export function useProductStore({ sellerId, supabaseClient }: UseProductStoreOptions = {}) {
  const [state, setState] = useState<ProductStoreState>({
    products: [],
    isLoading: true,
    error: null
  });

  // Load products from localStorage and optionally Supabase
  const loadProducts = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load from localStorage first
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localProducts: Product[] = localData ? JSON.parse(localData) : [];

      // If Supabase client is provided, merge with remote data
      if (supabaseClient && sellerId) {
        const { data: remoteProducts, error: remoteError } = await supabaseClient
          .from('products')
          .select('*')
          .eq('seller_id', sellerId)
          .eq('is_active', true);

        if (remoteError) {
          console.error('Failed to fetch from Supabase:', remoteError);
        } else if (remoteProducts && remoteProducts.length > 0) {
          // Merge local and remote, preferring remote for same SKU
          const skuMap = new Map<string, Product>();
          
          localProducts.forEach(p => skuMap.set(p.sku, p));
          remoteProducts.forEach((p: Product) => {
            if (!skuMap.has(p.sku)) {
              skuMap.set(p.sku, p);
            }
          });

          localProducts = Array.from(skuMap.values());
          
          // Save merged data to localStorage
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localProducts));
        }
      }

      setState({
        products: localProducts,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to load products:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load products'
      }));
    }
  }, [sellerId, supabaseClient]);

  // Save to localStorage
  const saveToLocalStorage = (products: Product[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  };

  // Add a single product
  const addProduct = useCallback(async (productData: Partial<Product>): Promise<Product | null> => {
    try {
      const now = new Date().toISOString();
      const searchString = productData.search_string || 
        `${productData.name} ${productData.sku}`.toLowerCase();

      const newProduct: Product = {
        id: productData.id || crypto.randomUUID(),
        seller_id: sellerId,
        source: productData.source || 'manual',
        external_id: productData.external_id,
        name: productData.name || '',
        sku: productData.sku || '',
        price: productData.price || 0,
        attributes: productData.attributes || {},
        search_string: searchString,
        image_url: productData.image_url,
        is_active: true,
        last_synced_at: productData.last_synced_at,
        created_at: productData.created_at || now,
        updated_at: now,
        variants: productData.variants
      };

      // Save to localStorage
      const currentProducts = state.products;
      const updatedProducts = [...currentProducts, newProduct];
      saveToLocalStorage(updatedProducts);

      // Update state
      setState(prev => ({
        ...prev,
        products: updatedProducts
      }));

      // Save to Supabase if available
      if (supabaseClient && sellerId) {
        const { error } = await supabaseClient
          .from('products')
          .upsert({
            id: newProduct.id,
            seller_id: sellerId,
            source: newProduct.source,
            external_id: newProduct.external_id,
            name: newProduct.name,
            sku: newProduct.sku,
            price: newProduct.price,
            attributes: newProduct.attributes,
            search_string: newProduct.search_string,
            image_url: newProduct.image_url,
            is_active: true,
            last_synced_at: newProduct.last_synced_at,
            updated_at: now
          }, { onConflict: 'seller_id,sku' });

        if (error) {
          console.error('Failed to save to Supabase:', error);
        }
      }

      return newProduct;
    } catch (error) {
      console.error('Failed to add product:', error);
      return null;
    }
  }, [sellerId, supabaseClient, state.products]);

  // Add multiple products (for CSV import)
  const addProducts = useCallback(async (products: Partial<Product>[]): Promise<number> => {
    let addedCount = 0;

    for (const productData of products) {
      const result = await addProduct(productData);
      if (result) addedCount++;
    }

    return addedCount;
  }, [addProduct]);

  // Update a product
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>): Promise<boolean> => {
    try {
      const currentProducts = state.products;
      const productIndex = currentProducts.findIndex(p => p.id === id);

      if (productIndex === -1) {
        console.error('Product not found:', id);
        return false;
      }

      const updatedProduct: Product = {
        ...currentProducts[productIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update search string if name or SKU changed
      if (updates.name || updates.sku) {
        updatedProduct.search_string = `${updatedProduct.name} ${updatedProduct.sku}`.toLowerCase();
      }

      const updatedProducts = [...currentProducts];
      updatedProducts[productIndex] = updatedProduct;
      
      saveToLocalStorage(updatedProducts);
      
      setState(prev => ({
        ...prev,
        products: updatedProducts
      }));

      // Update in Supabase
      if (supabaseClient) {
        const { error } = await supabaseClient
          .from('products')
          .update({
            name: updatedProduct.name,
            sku: updatedProduct.sku,
            price: updatedProduct.price,
            attributes: updatedProduct.attributes,
            search_string: updatedProduct.search_string,
            image_url: updatedProduct.image_url,
            is_active: updatedProduct.is_active,
            updated_at: updatedProduct.updated_at
          })
          .eq('id', id);

        if (error) {
          console.error('Failed to update in Supabase:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to update product:', error);
      return false;
    }
  }, [supabaseClient, state.products]);

  // Delete a product (soft delete)
  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      const currentProducts = state.products;
      const productIndex = currentProducts.findIndex(p => p.id === id);

      if (productIndex === -1) {
        return false;
      }

      // Soft delete - just mark as inactive
      const updatedProducts = currentProducts.map(p => 
        p.id === id ? { ...p, is_active: false, updated_at: new Date().toISOString() } : p
      );

      saveToLocalStorage(updatedProducts);
      
      setState(prev => ({
        ...prev,
        products: updatedProducts.filter(p => p.is_active)
      }));

      // Delete in Supabase
      if (supabaseClient) {
        const { error } = await supabaseClient
          .from('products')
          .update({ is_active: false })
          .eq('id', id);

        if (error) {
          console.error('Failed to delete in Supabase:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to delete product:', error);
      return false;
    }
  }, [supabaseClient, state.products]);

  // Add product from Canonical model
  const addCanonicalProduct = useCallback(async (
    canonical: CanonicalProduct
  ): Promise<Product | null> => {
    const productData = canonicalToProduct(canonical, sellerId);
    return addProduct(productData);
  }, [addProduct, sellerId]);

  // Search products by query
  const searchProducts = useCallback((query: string): Product[] => {
    if (!query.trim()) return state.products;

    const lowerQuery = query.toLowerCase();
    return state.products.filter(product => 
      product.search_string?.includes(lowerQuery) ||
      product.name.toLowerCase().includes(lowerQuery) ||
      product.sku.toLowerCase().includes(lowerQuery)
    );
  }, [state.products]);

  // Get products by source
  const getProductsBySource = useCallback((source: ProductSource): Product[] => {
    return state.products.filter(p => p.source === source);
  }, [state.products]);

  // Refresh products from source (for Shopify)
  const refreshFromSource = useCallback(async (source: ProductSource): Promise<void> => {
    if (source === 'shopify') {
      // TODO: Implement Shopify sync
      console.log('Refreshing from Shopify...');
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products: state.products,
    isLoading: state.isLoading,
    error: state.error,
    addProduct,
    addProducts,
    addCanonicalProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductsBySource,
    refreshFromSource,
    reload: loadProducts
  };
}

/**
 * Get source icon/name for display
 */
export const getSourceDisplayInfo = (source: ProductSource): { 
  icon: string; 
  label: string; 
  color: string 
} => {
  switch (source) {
    case 'shopify':
      return { icon: '🛍️', label: 'Shopify', color: '#96bf48' };
    case 'csv':
      return { icon: '📄', label: 'CSV', color: '#1877f2' };
    case 'manual':
      return { icon: '✏️', label: 'Manual', color: '#6b7280' };
    default:
      return { icon: '❓', label: 'Unknown', color: '#6b7280' };
  }
};
