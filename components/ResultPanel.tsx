import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
}

interface ResultPanelProps {
  product: Product | null;
  confidence: number;
  message: string;
  onGenerateLink: () => void;
  onConfirm?: () => void;
  onDismiss?: () => void;
}

type ConfidenceLevel = 'high' | 'medium' | 'low';

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence > 0.9) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

export function ResultPanel({
  product,
  confidence,
  message,
  onGenerateLink,
  onConfirm
}: ResultPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showConfirmChip, setShowConfirmChip] = useState(false);
  
  const level = getConfidenceLevel(confidence);
  
  const handleCopy = async () => {
    if (!product) return;
    
    const link = `https://your-store.com/cart/${product.sku}:1`;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      
      // Show system notification
      if (chrome?.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icons/icon128.png',
          title: 'OrderSync Agent',
          message: 'Link copied to clipboard!'
        });
      }
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleConfirm = () => {
    setShowConfirmChip(false);
    onConfirm?.();
  };

  if (!product) return null;

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg border border-slate-200">
      {/* Confidence Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Detection</span>
          <ConfidenceBadge confidence={confidence} level={level} />
        </div>
        
        {level === 'medium' && !showConfirmChip && (
          <button
            onClick={() => setShowConfirmChip(true)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Show alternatives
          </button>
        )}
      </div>

      {/* Quick Suggestion Header */}
      <AnimatePresence mode="wait">
        {level === 'high' && (
          <motion.div
            key="high"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3"
          >
            <p className="text-sm text-emerald-600 font-medium">
              ✓ High confidence match detected
            </p>
          </motion.div>
        )}

        {level === 'medium' && (
          <motion.div
            key="medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3"
          >
            <p className="text-sm text-amber-600 font-medium">
              Is this what they meant?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Card */}
      <div className="p-3 bg-slate-50 rounded-lg mb-3">
        <h3 className="font-semibold text-slate-900">{product.name}</h3>
        <p className="text-sm text-slate-500">SKU: {product.sku}</p>
        <p className="text-lg font-bold text-[#1877F2] mt-1">
          ${product.price.toFixed(2)}
        </p>
      </div>

      {/* Medium Confidence Confirmation Chip */}
      <AnimatePresence>
        {level === 'medium' && showConfirmChip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-sm text-amber-700">
                Did they mean "{product.name}"?
              </span>
              <button
                onClick={handleConfirm}
                className="px-3 py-1 bg-[#1877F2] text-white text-xs rounded-full font-medium"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmChip(false)}
                className="px-3 py-1 text-slate-500 text-xs"
              >
                No
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <motion.button
          onClick={onGenerateLink}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 py-2.5 px-4 font-medium rounded-lg transition-all text-white flex items-center justify-center gap-2 ${
            level === 'high'
              ? 'bg-[#1877F2] hover:bg-[#166fe5]'
              : 'bg-[#1877F2] hover:bg-[#166fe5]'
          }`}
        >
          {level === 'high' && (
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ⚡
            </motion.span>
          )}
          Generate Link
        </motion.button>

        <motion.button
          onClick={handleCopy}
          whileTap={{ scale: 0.95 }}
          className={`py-2.5 px-4 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            copied
              ? 'bg-emerald-500 text-white border-2 border-emerald-500'
              : 'bg-white text-slate-700 border border-slate-200 hover:border-[#1877F2]'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy
            </>
          )}
        </motion.button>
      </div>

      {/* Message Preview */}
      {message && (
        <p className="text-xs text-slate-400 mt-3 truncate">
          "{message}"
        </p>
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence, level }: { confidence: number; level: ConfidenceLevel }) {
  const colors = {
    high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[level]}`}>
      {Math.round(confidence * 100)}%
    </span>
  );
}

export default ResultPanel;
