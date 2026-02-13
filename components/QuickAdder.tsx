/**
 * Quick Adder Component
 * Simple form for manually adding products to the catalog
 */

import React, { useState } from 'react';
import type { Product } from '../types/products';

interface QuickAdderProps {
  sellerId?: string;
  onProductAdded?: (product: Partial<Product>) => void;
  onCancel?: () => void;
}

interface QuickAdderForm {
  name: string;
  sku: string;
  price: string;
}

const BRAND_BLUE = '#1877F2';

export default function QuickAdder({ sellerId, onProductAdded, onCancel }: QuickAdderProps) {
  const [form, setForm] = useState<QuickAdderForm>({
    name: '',
    sku: '',
    price: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof QuickAdderForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof QuickAdderForm, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!form.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!form.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(form.price);
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = 'Please enter a valid price';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const product: Partial<Product> = {
        seller_id: sellerId,
        source: 'manual',
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: parseFloat(form.price),
        attributes: {},
        search_string: `${form.name} ${form.sku}`.toLowerCase(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Simulate API call or localStorage save
      await new Promise(resolve => setTimeout(resolve, 500));

      if (onProductAdded) {
        onProductAdded(product);
      }

      // Show success state
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form
        setForm({ name: '', sku: '', price: '' });
      }, 1500);

    } catch (error) {
      console.error('Failed to add product:', error);
      setErrors({ name: 'Failed to save product. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof QuickAdderForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Quick Add Product</h2>
          <p className="text-sm text-slate-500 mt-1">
            Add a product manually to your catalog
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showSuccess ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Product Added!</h3>
          <p className="text-slate-500 mt-1">
            {form.name} has been added to your catalog
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="e.g., Vintage Denim Jacket"
              className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
              }`}
              style={errors.name ? {} : { '--tw-ring-color': 'rgba(24, 119, 242, 0.2)' } as any}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={handleChange('sku')}
              placeholder="e.g., VDJ-001-BLU"
              className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.sku
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
              }`}
            />
            {errors.sku && (
              <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <input
                type="text"
                value={form.price}
                onChange={handleChange('price')}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-2.5 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.price
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'border-slate-200 focus:ring-blue-200 focus:border-blue-400'
                }`}
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 text-white font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: isSubmitting ? '#94a3b8' : BRAND_BLUE,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#166fe5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = BRAND_BLUE;
                }
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </span>
              ) : (
                'Add Product'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
