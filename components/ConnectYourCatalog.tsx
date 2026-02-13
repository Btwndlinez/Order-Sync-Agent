/**
 * Connect Your Catalog Component
 * Onboarding screen for connecting product sources
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { Product, CSVImportResult } from '../types/products';
import { parseCSVFile } from '../utils/csvParser';
import { mapToCanonicalProduct } from '../utils/canonicalMapper';
import QuickAdder from './QuickAdder';

interface ConnectYourCatalogProps {
  sellerId?: string;
  onProductsImported?: (products: Partial<Product>[]) => void;
  onManualAdd?: (product: Partial<Product>) => void;
}

type ConnectView = 'select' | 'csv' | 'manual';

export default function ConnectYourCatalog({ 
  sellerId,
  onProductsImported,
  onManualAdd 
}: ConnectYourCatalogProps) {
  const [view, setView] = useState<ConnectView>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const handleCSVDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setCsvError(null);
    setImportResult(null);

    try {
      const result = await parseCSVFile(file, sellerId);
      setImportResult(result);

      if (result.success && result.products.length > 0) {
        // Map to canonical model and notify parent
        const canonicalProducts = result.products.map(p => 
          mapToCanonicalProduct(p, 'csv')
        );
        
        const mappedProducts = canonicalProducts.map(canonical => ({
          ...canonical.variants[0],
          name: canonical.title,
          source: 'csv' as const,
          search_string: `${canonical.title} ${canonical.variants[0]?.sku || ''}`.toLowerCase()
        }));

        onProductsImported?.(mappedProducts);
      }
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : 'Failed to process CSV');
    } finally {
      setIsProcessing(false);
    }
  }, [sellerId, onProductsImported]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleCSVDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  });

  const handleManualProductAdded = (product: Partial<Product>) => {
    onManualAdd?.(product);
    setView('select');
  };

  const renderSelectView = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Connect Your Catalog
        </h2>
        <p className="text-slate-600">
          Choose how you want to add products to your catalog
        </p>
      </div>

      <div className="grid gap-4">
        {/* Path A: Shopify */}
        <button
          className="relative flex items-center p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-[#96bf48] hover:bg-[#96bf48]/5 transition-all text-left group"
          disabled
        >
          <div className="w-12 h-12 bg-[#96bf48]/10 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#96bf48">
              <path d="M15.34 15.58c-.17-.12-.42-.18-.64-.12l-1.12.36c-.36.12-.78.06-1.02-.24l-.72-.9c-.36-.48-.12-1.14.48-1.38l1.2-.48c.24-.12.42-.36.42-.66v-.06c0-.54-.48-.9-1.02-.72l-1.56.48c-.54.18-1.14-.06-1.38-.6l-.6-1.38c-.24-.54.06-1.14.6-1.38l1.56-.6c.54-.24 1.14.06 1.38.6l.48 1.14c.12.24.06.54-.12.72l-1.08 1.08c.18.12.42.18.66.12l1.44-.36c.54-.12 1.08.18 1.2.72l.36 1.56c.12.48-.12 1.02-.6 1.2l-1.56.48c-.12.06-.24.06-.36 0z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Connect Shopify</h3>
            <p className="text-sm text-slate-500">
              Sync your Shopify product catalog automatically
            </p>
          </div>
          <span className="absolute top-3 right-3 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            Coming Soon
          </span>
        </button>

        {/* Path B: CSV Upload */}
        <button
          onClick={() => setView('csv')}
          className="flex items-center p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-[#1877F2] hover:bg-blue-50/50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-[#1877F2]/10 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-[#1877F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Upload CSV</h3>
            <p className="text-sm text-slate-500">
              Import products from a CSV file
            </p>
          </div>
          <svg className="w-5 h-5 text-slate-400 group-hover:text-[#1877F2] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Path C: Manual Add */}
        <button
          onClick={() => setView('manual')}
          className="flex items-center p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-[#1877F2] hover:bg-blue-50/50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-[#1877F2]/10 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-[#1877F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Manual Add</h3>
            <p className="text-sm text-slate-500">
              Add individual products one at a time
            </p>
          </div>
          <svg className="w-5 h-5 text-slate-400 group-hover:text-[#1877F2] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderCSVView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Upload CSV</h2>
        <button
          onClick={() => {
            setView('select');
            setImportResult(null);
            setCsvError(null);
          }}
          className="text-slate-500 hover:text-slate-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!importResult ? (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-[#1877F2] bg-blue-50' 
                : 'border-slate-300 hover:border-[#1877F2] hover:bg-slate-50'
            }`}
          >
            <input {...getInputProps()} />
            
            {isProcessing ? (
              <div className="py-8">
                <svg className="animate-spin h-10 w-10 text-[#1877F2] mx-auto mb-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600">Processing CSV...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-slate-700 font-medium mb-2">
                  {isDragActive ? 'Drop your CSV here' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-slate-500 text-sm">
                  or click to browse files
                </p>
                <p className="text-slate-400 text-xs mt-4">
                  Required columns: Title, SKU, Price
                </p>
              </>
            )}
          </div>

          {csvError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{csvError}</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Import Results</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              importResult.success 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {importResult.success ? 'Success' : 'Completed with errors'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{importResult.totalRows}</p>
              <p className="text-sm text-slate-500">Total Rows</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{importResult.importedRows}</p>
              <p className="text-sm text-emerald-600">Imported</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{importResult.errors.length}</p>
              <p className="text-sm text-red-600">Errors</p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Errors</h4>
              <div className="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3">
                {importResult.errors.slice(0, 5).map((error, i) => (
                  <p key={i} className="text-xs text-red-600">
                    Row {error.row}: {error.message}
                  </p>
                ))}
                {importResult.errors.length > 5 && (
                  <p className="text-xs text-red-600 mt-2">
                    ...and {importResult.errors.length - 5} more errors
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setImportResult(null);
              setView('select');
            }}
            className="w-full py-3 bg-[#1877F2] text-white font-medium rounded-lg hover:bg-[#166fe5] transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );

  const renderManualView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Add Product</h2>
        <button
          onClick={() => setView('select')}
          className="text-slate-500 hover:text-slate-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <QuickAdder
        sellerId={sellerId}
        onProductAdded={handleManualProductAdded}
        onCancel={() => setView('select')}
      />
    </div>
  );

  return (
    <div className="min-h-[400px]">
      {view === 'select' && renderSelectView()}
      {view === 'csv' && renderCSVView()}
      {view === 'manual' && renderManualView()}
    </div>
  );
}
