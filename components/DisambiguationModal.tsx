import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  variants?: { size?: string; color?: string }[];
  confidence?: number;
}

interface DisambiguationModalProps {
  isOpen: boolean;
  products: Product[];
  onSelect: (product: Product) => void;
  onDismiss: () => void;
  leadName?: string;
}

export function DisambiguationModal({
  isOpen,
  products,
  onSelect,
  onDismiss,
  leadName
}: DisambiguationModalProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(0);
      setSelectedIndex(null);
      setShowPulse(false);
    }
  }, [isOpen]);

  const handleSelect = (product: Product, index: number) => {
    setSelectedIndex(index);
    setShowPulse(true);
    setTimeout(() => {
      onSelect(product);
    }, 600);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, products.length - 1));
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case '1':
          if (products[0]) {
            e.preventDefault();
            handleSelect(products[0], 0);
          }
          break;
        case '2':
          if (products[1]) {
            e.preventDefault();
            handleSelect(products[1], 1);
          }
          break;
        case '3':
          if (products[2]) {
            e.preventDefault();
            handleSelect(products[2], 2);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onDismiss();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, products, onSelect, onDismiss]);

  if (!isOpen) return null;

  const isTwoColumn = products.length === 2;
  const getDifferentiatingAttribute = (product: Product) => {
    const attrs: string[] = [];
    if (product.variants?.[0]?.size) attrs.push(`Size: ${product.variants[0].size}`);
    if (product.variants?.[0]?.color) attrs.push(`Color: ${product.variants[0].color}`);
    return { sku: `SKU: ${product.sku}`, attrs: attrs.join(' • ') };
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* PAS Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  ⚠️ Variant Conflict Found
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Avoid shipping errors — pick the right SKU
                </p>
              </div>
              {leadName && (
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                  {leadName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Press <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-medium">1</kbd>, <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-medium">2</kbd>{products.length > 2 && <><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs font-medium ml-1">3</kbd></>} to select instantly
            </p>
          </div>

          {/* Quick Compare - 50/50 Split with VS Badge */}
          <div className="p-4 relative">
            {isTwoColumn && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  VS
                </div>
              </div>
            )}
            <div className={`grid ${isTwoColumn ? 'grid-cols-2 gap-6' : 'grid-cols-3 gap-4'}`}>
              {products.slice(0, isTwoColumn ? 2 : 3).map((product, idx) => (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: selectedIndex === idx && showPulse ? 1.02 : 1
                }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleSelect(product, idx)}
                onFocus={() => setFocusedIndex(idx)}
                className={`relative w-full p-4 rounded-xl border-2 text-left transition-all ${
                  focusedIndex === idx
                    ? 'border-[#1877F2] bg-blue-50 shadow-lg shadow-blue-100'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                } ${selectedIndex === idx && showPulse ? 'ring-4 ring-green-400 ring-opacity-50' : ''}`}
              >
                {/* Success Pulse Animation */}
                {selectedIndex === idx && showPulse && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 rounded-xl bg-green-400"
                  />
                )}
                {/* Keyboard hint */}
                <div className={`absolute top-3 ${isTwoColumn ? 'left-3' : 'left-3'}`}>
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full text-xs font-bold text-slate-500">
                    {idx + 1}
                  </span>
                </div>

                {/* Product Name */}
                <div className="mt-2">
                  <h3 className="font-semibold text-slate-900 text-lg">{product.name}</h3>
                </div>

                {/* Differentiating Attributes */}
                <div className="mt-3 space-y-1">
                  {(() => {
                    const diff = getDifferentiatingAttribute(product);
                    return (
                      <>
                        <p className="text-sm font-medium" style={{ color: '#1877F2' }}>
                          {diff.sku}
                          {diff.attrs && ` • ${diff.attrs}`}
                        </p>
                        <p className="text-2xl font-bold text-slate-900">
                          ${product.price.toFixed(2)}
                        </p>
                      </>
                    );
                  })()}
                </div>

                {/* Confidence Badge */}
                {product.confidence !== undefined && (
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.confidence >= 0.75
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {Math.round(product.confidence * 100)}%
                    </span>
                  </div>
                )}

                {/* Selection indicator */}
                {focusedIndex === idx && (
                  <div className="absolute bottom-3 right-3">
                    <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onDismiss}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              None of these
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-white border rounded">↑↓</kbd> Navigate
              <kbd className="px-1.5 py-0.5 bg-white border rounded">Enter</kbd> Select
              <kbd className="px-1.5 py-0.5 bg-white border rounded">Esc</kbd> Close
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DisambiguationModal;
