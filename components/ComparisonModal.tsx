import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  image_url?: string;
  confidence?: number;
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelect: (product: Product) => void;
  title?: string;
}

export function ComparisonModal({
  isOpen,
  onClose,
  products,
  onSelect,
  title = 'Select the correct product'
}: ComparisonModalProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(null);
      setFocusedIndex(0);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, products.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case '1':
        case '2':
        case '3':
          const idx = parseInt(e.key) - 1;
          if (idx < products.length) {
            e.preventDefault();
            onSelect(products[idx]);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && products[focusedIndex]) {
            onSelect(products[focusedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, products, onSelect, onClose]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.75) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (confidence >= 0.45) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Press 1, 2, or 3 for instant selection
            </p>
          </div>

          {/* Comparison Matrix */}
          <div className="p-4">
            <div className="grid gap-3">
              {products.map((product, idx) => (
                <motion.button
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onSelect(product)}
                  onFocus={() => setFocusedIndex(idx)}
                  className={`relative w-full p-4 rounded-xl border-2 text-left transition-all ${
                    focusedIndex === idx
                      ? 'border-[#1877F2] bg-blue-50 shadow-md'
                      : selectedIndex === idx
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {/* Keyboard hint */}
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                    {idx + 1}
                  </div>

                  <div className="ml-10">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{product.name}</h3>
                      {product.confidence !== undefined && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getConfidenceColor(product.confidence)}`}>
                          {Math.round(product.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span>SKU: {product.sku}</span>
                      <span className="font-semibold text-[#1877F2]">${product.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {selectedIndex === idx && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">Enter</kbd> Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">Esc</kbd> Close
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ComparisonModal;
