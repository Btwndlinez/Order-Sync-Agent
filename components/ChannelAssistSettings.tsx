/**
 * Channel Assist Settings Page
 * Product catalog management integrated with Channel Assist
 */

import { useState } from 'react';
import { useProductStore } from '../hooks/useProductStore';
import ConnectYourCatalog from './ConnectYourCatalog';
import UnifiedCatalogTable from './UnifiedCatalogTable';
import type { Product } from '../types/products';

interface ChannelAssistSettingsProps {
  sellerId?: string;
  supabaseClient?: any;
}

export default function ChannelAssistSettings({ 
  sellerId, 
  supabaseClient 
}: ChannelAssistSettingsProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'settings'>('catalog');
  
  const {
    products,
    isLoading,
    addProduct,
    addProducts,
    updateProduct,
    deleteProduct,
    refreshFromSource
  } = useProductStore({ sellerId, supabaseClient });

  const handleProductsImported = async (importedProducts: any[]) => {
    await addProducts(importedProducts);
  };

  const handleManualAdd = async (product: any) => {
    await addProduct(product);
  };

  const handleRefreshShopify = async (_product: Product) => {
    await refreshFromSource('shopify');
  };

  const tabs = [
    { id: 'catalog', label: 'Product Catalog', icon: PackageIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Channel Assist</h1>
          <p className="text-slate-600 mt-1">
            Manage your product catalog and sync settings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#1877F2]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1877F2]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {activeTab === 'catalog' && (
            <div className="p-6">
              {products.length === 0 && !isLoading ? (
                <ConnectYourCatalog
                  sellerId={sellerId}
                  onProductsImported={handleProductsImported}
                  onManualAdd={handleManualAdd}
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Your Products
                      </h2>
                      <p className="text-sm text-slate-500">
                        {products.length} product{products.length !== 1 ? 's' : ''} in catalog
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="px-4 py-2 bg-[#1877F2] text-white text-sm font-medium rounded-lg hover:bg-[#166fe5] transition-colors"
                    >
                      Add Products
                    </button>
                  </div>

                  <UnifiedCatalogTable
                    products={products}
                    isLoading={isLoading}
                    onEdit={updateProduct}
                    onDelete={deleteProduct}
                    onRefresh={handleRefreshShopify}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <SettingsPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [storeUrl, setStoreUrl] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('channel_assist_store_url', storeUrl);
    localStorage.setItem('channel_assist_gemini_key', geminiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Store URL */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Store Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Store URL
            </label>
            <input
              type="url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://your-store.myshopify.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
            />
            <p className="text-xs text-slate-500 mt-1">
              Your Shopify or Stripe store URL for cart link generation
            </p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">API Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gemini API Key
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used for intent extraction from customer messages
            </p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Export Products</p>
              <p className="text-sm text-slate-500">Download your product catalog as CSV</p>
            </div>
            <button className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Export
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-red-900">Clear All Products</p>
              <p className="text-sm text-red-600">Remove all products from local storage</p>
            </div>
            <button className="px-4 py-2 border border-red-200 bg-white text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-[#1877F2] text-white hover:bg-[#166fe5]'
          }`}
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// Simple Icons
function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
