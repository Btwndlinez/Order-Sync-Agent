import React, { useState } from 'react';
import { Plus, Search, Package, Tag, Trash2, Edit3 } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  return (
    <div className="fb-card product-card">
      <div className="product-card-header">
        <div className="product-icon">
          <Package size={24} color="#1877f2" />
        </div>
        <div className="product-info">
          <h4>{product.title}</h4>
          <span className="product-id">ID: {product.id}</span>
        </div>
        <div className="product-actions">
          <button className="icon-btn" onClick={() => onEdit(product)}>
            <Edit3 size={16} />
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(product.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="product-variants">
        <h5>Variants ({product.variants.length})</h5>
        <div className="variants-list">
          {product.variants.map(variant => (
            <div key={variant.id} className="variant-item">
              <span className="variant-title">{variant.title}</span>
              <span className="variant-price">${variant.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface CatalogViewProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ products, onUpdateProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [_showAddModal, setShowAddModal] = useState(false);
  const [_editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  return (
    <div className="catalog-view">
      <div className="catalog-header">
        <h2>Product Catalog</h2>
        <div className="catalog-actions">
          <div className="search-box">
            <Search size={18} color="#65676b" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="fb-btn fb-btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="catalog-stats">
        <div className="stat-card">
          <Package size={24} color="#1877f2" />
          <div>
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Products</span>
          </div>
        </div>
        <div className="stat-card">
          <Tag size={24} color="#42b72a" />
          <div>
            <span className="stat-value">{products.reduce((acc, p) => acc + p.variants.length, 0)}</span>
            <span className="stat-label">Variants</span>
          </div>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={48} color="#bcc0c4" />
            <p>No products found</p>
            <span>Add products to your catalog to get started</span>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};
