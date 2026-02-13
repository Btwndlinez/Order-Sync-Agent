/**
 * Connect Your Catalog - Onboarding Component
 * Three-path onboarding: Shopify, CSV Upload, Manual Add
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import QuickAdder from './QuickAdder';
import { parseCSVFile } from '../utils/csvParser';
import { mapToCanonicalBatch, canonicalToProduct } from '../utils/canonicalMapper';
import type { Product, ProductSource } from '../types/products';

interface ConnectCatalogProps {
  sellerId?: string;
  onCatalogConnected?: (source: ProductSource, products: Partial<Product>[]) => void;
}

type OnboardingPath = 'selection' | 'shopify' | 'csv' | 'manual';

export default function ConnectCatalog({ sellerId, onCatalogConnected }: ConnectCatalogProps) {
  const [currentPath, setCurrentPath] = useState<OnboardingPath>('selection');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; processed: number } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress({ total: 0, processed: 0 });

    try {
      const result = await parseCSVFile(file, sellerId);
      
      if (result.success || result.importedRows > 0) {
        // Map to canonical format
        const canonicalProducts = mapToCanonicalBatch(result.products as any[], 'csv');
        
        // Convert to internal product structure
        const products = canonicalProducts.map(cp => canonicalToProduct(cp, sellerId));
        
        setUploadProgress({ total: result.totalRows, processed: result.importedRows });
        
        if (onCatalogConnected) {
          onCatalogConnected('csv', products);
        }

        // Show success briefly then return to selection
        setTimeout(() => {
          setCurrentPath('selection');
          setIsUploading(false);
          setUploadProgress(null);
        }, 2000);
      }
    } catch (error) {
      console.error('CSV upload failed:', error);
      setIsUploading(false);
    }
  }, [sellerId, onCatalogConnected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleManualAdd = (product: Partial<Product>) => {
    if (onCatalogConnected) {
      onCatalogConnected('manual', [product]);
    }
    setCurrentPath('selection');
  };

  const renderPathSelection = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Connect Your Catalog
        </h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          Choose how you'd like to add products to your Order Sync Agent catalog.
          You can connect multiple sources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Path A: Connect Shopify */}
        <button
          onClick={() => setCurrentPath('shopify')}
          className="group relative bg-white rounded-2xl shadow-md border border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all text-left"
        >
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Coming Soon
            </span>
          </div>
          
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Connect Shopify
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Sync your Shopify store automatically. Products update in real-time.
          </p>
          
          <div className="flex items-center text-blue-600 font-medium text-sm">
            <span>Learn more</span>
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Path B: Upload CSV */}
        <button
          onClick={() => setCurrentPath('csv')}
          className="group bg-white rounded-2xl shadow-md border border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all text-left"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Upload CSV
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Import products from a spreadsheet. Supports standard CSV formats.
          </p>
          
          <div className="flex items-center text-blue-600 font-medium text-sm">
            <span>Upload file</span>
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Path C: Manual Add */}
        <button
          onClick={() => setCurrentPath('manual')}
          className="group bg-white rounded-2xl shadow-md border border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all text-left"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Manual Add
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Add products one by one. Perfect for small catalogs or testing.
          </p>
          
          <div className="flex items-center text-blue-600 font-medium text-sm">
            <span>Add product</span>
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          Need help?{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            View supported formats
          </a>
        </p>
      </div>
    </div>
  );

  const renderShopifyPath = () => (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => setCurrentPath('selection')}
        className="mb-6 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Shopify Integration
        </h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Connect your Shopify store to automatically sync products, inventory, and orders. 
          This feature is currently in development.
        </p>
        
        <div className="inline-flex items-center px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Coming Soon</span>
        </div>
        
        <button
          onClick={() => setCurrentPath('selection')}
          className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          Choose Another Method
        </button>
      </div>
    </div>
  );

  const renderCSVPath = () => (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => setCurrentPath('selection')}
        className="mb-6 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Upload CSV File
        </h2>
        <p className="text-slate-600 mb-6">
          Drag and drop your CSV file, or click to browse. We support standard product export formats.
        </p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-slate-900">Processing CSV...</p>
              {uploadProgress && (
                <p className="text-slate-600">
                  Imported {uploadProgress.processed} of {uploadProgress.total} products
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-slate-900 mb-2">
                {isDragActive ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
              </p>
              <p className="text-sm text-slate-500">
                or click to browse files
              </p>
            </>
          )}
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-900 mb-2">
            Required CSV Columns:
          </h4>
          <div className="flex flex-wrap gap-2">
            {['Title', 'SKU', 'Price'].map(col => (
              <span
                key={col}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700"
              >
                {col}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Additional columns will be stored as product attributes
          </p>
        </div>
      </div>
    </div>
  );

  const renderManualPath = () => (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => setCurrentPath('selection')}
        className="mb-6 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <QuickAdder
        sellerId={sellerId}
        onProductAdded={handleManualAdd}
        onCancel={() => setCurrentPath('selection')}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      {currentPath === 'selection' && renderPathSelection()}
      {currentPath === 'shopify' && renderShopifyPath()}
      {currentPath === 'csv' && renderCSVPath()}
      {currentPath === 'manual' && renderManualPath()}
    </div>
  );
}
