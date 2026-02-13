/**
 * MainShell
 * Parent container for Channel Assist module
 * Sprint 1 - State & Shell Setup
 */

import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { getMockProducts } from '../utils/apiHandlers';
import MessageInputPanel from './MessageInputPanel';
import SuggestionPanel from './SuggestionPanel';
import RecentActivity from './RecentActivity';

interface MainShellProps {
  width?: number;
}

export default function MainShell({ width = 380 }: MainShellProps) {
  const { 
    products, 
    setProducts, 
    loadProductsFromCache,
    checkSelection,
    usageCount,
    planTier,
    autoCaptured,
    detectedContext,
    setDetectedContext,
    clearDetectedContext,
    setMessageInput,
  } = useStore();

  const [showAutoCaptured, setShowAutoCaptured] = useState(false);

  // Initialize products - load from cache first, then mock data
  useEffect(() => {
    loadProductsFromCache();

    const timer = setTimeout(() => {
      const currentProducts = useStore.getState().products;
      if (currentProducts.length === 0) {
        const mockProducts = getMockProducts();
        setProducts(mockProducts);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Check for auto-captured text from selection
  useEffect(() => {
    checkSelection();
  }, []);

  // Listen for CONTEXT_DETECTED from content script
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const handleMessage = (request: any) => {
        if (request.type === 'CONTEXT_DETECTED') {
          setDetectedContext(request.payload);
        }
      };
      
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }
  }, []);

  // Show auto-captured toast
  useEffect(() => {
    if (autoCaptured) {
      setShowAutoCaptured(true);
      const timer = setTimeout(() => {
        setShowAutoCaptured(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoCaptured]);

  const handleLoadDetected = () => {
    if (detectedContext) {
      setMessageInput(detectedContext);
      clearDetectedContext();
    }
  };

  const usageLimit = planTier === 'free' ? 10 : planTier === 'pro' ? 100 : '∞';
  const usageDisplay = `${usageCount} / ${usageLimit} ${planTier === 'free' ? 'Free' : planTier === 'pro' ? 'Pro' : ''}`;

  return (
    <div 
      className="min-h-screen bg-slate-100 flex flex-col"
      style={{ width }}
    >
      {/* Header: Channel Assist + Logo */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Channel Assist</h1>
        </div>
      </header>

      {/* Body: Scrollable area for Input and Suggestion panels */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Auto-captured toast */}
        {showAutoCaptured && (
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700 animate-pulse">
            <span>✨</span>
            Auto-captured from chat
          </div>
        )}

        {/* Detected Context notification */}
        {detectedContext && (
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-amber-600">🎯</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Purchase Intent Detected</p>
                <p className="text-xs text-amber-600 mt-1 line-clamp-2">{detectedContext}</p>
              </div>
              <button
                onClick={handleLoadDetected}
                className="flex-shrink-0 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600 transition-colors"
              >
                Load
              </button>
            </div>
          </div>
        )}

        {/* Message Input Panel */}
        <MessageInputPanel />

        {/* Suggestion Panel */}
        <SuggestionPanel />

        {/* Recent Activity */}
        <RecentActivity />

        {/* Product Count Info */}
        <div className="text-center text-xs text-slate-500">
          {products.length} product{products.length !== 1 ? 's' : ''} in catalog
        </div>
      </main>

      {/* Footer: Usage Meter */}
      <footer className="flex-shrink-0 px-4 py-3 bg-white border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">
            {usageDisplay}
          </span>
          <button className="text-xs text-[#1877F2] hover:underline font-medium">
            Upgrade
          </button>
        </div>
      </footer>
    </div>
  );
}
