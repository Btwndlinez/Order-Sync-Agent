/**
 * Unified Catalog Table Component
 * Displays products from all sources in a unified table
 */

import { useState } from 'react';
import type { Product, ProductSource } from '../types/products';
import { getSourceDisplayInfo } from '../hooks/useProductStore';

interface UnifiedCatalogTableProps {
  products: Product[];
  onEdit?: (id: string, updates: Partial<Product>) => void | Promise<boolean>;
  onDelete?: (productId: string) => void;
  onRefresh?: (product: Product) => void;
  isLoading?: boolean;
}

export default function UnifiedCatalogTable({
  products,
  onEdit,
  onDelete,
  onRefresh,
  isLoading
}: UnifiedCatalogTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<ProductSource | 'all'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: '', sku: '', price: '' });

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.search_string?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = sourceFilter === 'all' || product.source === sourceFilter;
    
    return matchesSearch && matchesSource;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      sku: product.sku,
      price: product.price.toString()
    });
  };

  const handleSaveEdit = () => {
    if (editingProduct && onEdit) {
      onEdit(editingProduct.id, {
        ...editingProduct,
        name: editForm.name,
        sku: editForm.sku,
        price: parseFloat(editForm.price) || 0,
        search_string: `${editForm.name} ${editForm.sku}`.toLowerCase()
      });
      setEditingProduct(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditForm({ name: '', sku: '', price: '' });
  };

  const handleRefresh = (product: Product) => {
    if (product.source === 'shopify' && onRefresh) {
      onRefresh(product);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-[#1877F2]" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
          />
        </div>
        
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as ProductSource | 'all')}
          className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
        >
          <option value="all">All Sources</option>
          <option value="manual">Manual</option>
          <option value="csv">CSV</option>
          <option value="shopify">Shopify</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  {searchQuery || sourceFilter !== 'all' 
                    ? 'No products match your filters'
                    : 'No products yet. Add products to get started.'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-slate-900 text-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <span className="font-medium text-slate-900">{product.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        value={editForm.sku}
                        onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-slate-900 text-sm font-mono"
                      />
                    ) : (
                      <span className="text-slate-600 font-mono text-sm">{product.sku}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-slate-900 text-sm"
                      />
                    ) : (
                      <span className="text-slate-900 font-medium">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const sourceInfo = getSourceDisplayInfo(product.source);
                      return (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${sourceInfo.color}15`,
                            color: sourceInfo.color 
                          }}
                        >
                          <span>{sourceInfo.icon}</span>
                          {sourceInfo.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingProduct?.id === product.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Save"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        {product.source === 'manual' && onEdit && (
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-slate-500 hover:text-[#1877F2] hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {product.source === 'shopify' && onRefresh && (
                          <button
                            onClick={() => handleRefresh(product)}
                            className="p-1.5 text-slate-500 hover:text-[#96bf48] hover:bg-[#96bf48]/10 rounded transition-colors"
                            title="Refresh from Shopify"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                        {onDelete && product.source === 'manual' && (
                          <button
                            onClick={() => onDelete(product.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination info */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {filteredProducts.length} of {products.length} products
          </span>
          {(searchQuery || sourceFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSourceFilter('all');
              }}
              className="text-[#1877F2] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
