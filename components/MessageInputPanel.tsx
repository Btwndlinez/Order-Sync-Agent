/**
 * Message Input Panel
 * Handles textarea input and analyze trigger
 * Includes channel badge for auto-detected messages
 */

import { useState, useEffect, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { analyzeMessage } from '../utils/apiHandlers';

interface MessageInputPanelProps {
  onAnalyze?: () => void;
}

// Channel badge icons
const ChannelBadge = ({ source }: { source: string }) => {
  const isWhatsApp = source === 'whatsapp';
  const isMessenger = source === 'messenger';
  
  if (!isWhatsApp && !isMessenger) return null;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      isWhatsApp 
        ? 'bg-emerald-100 text-emerald-700' 
        : 'bg-blue-100 text-blue-700'
    }`}>
      {isWhatsApp ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      )}
      {isWhatsApp ? 'WhatsApp' : 'Messenger'}
    </span>
  );
};

export default function MessageInputPanel({ onAnalyze }: MessageInputPanelProps) {
  const {
    messageInput,
    setMessageInput,
    products,
    setSuggestions,
    selectSuggestion,
    setIsProcessing,
    setError,
    clearState,
  } = useStore();

  const [localInput, setLocalInput] = useState(messageInput);
  const [detectedChannel, setDetectedChannel] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Debounced auto-analyze at 20+ characters
  useEffect(() => {
    if (localInput.length >= 20 && products.length > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        handleAnalyze();
      }, 500);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localInput, products]);

  const handleAnalyze = async () => {
    if (!localInput.trim() || products.length === 0) return;

    setIsProcessing(true);
    setError(null);
    clearState();

    try {
      const suggestions = await analyzeMessage(localInput, products);
      setSuggestions(suggestions);
      
      // Auto-select first high-confidence suggestion
      if (suggestions.length > 0) {
        if (suggestions[0].confidence >= 0.7) {
          selectSuggestion(suggestions[0].id);
        }
      }
      
      onAnalyze?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze message');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to analyze
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  // Listen for pending intents from background
  useEffect(() => {
    const checkForPendingIntents = async () => {
      try {
        const result = await chrome.storage.local.get(['latestIntent', 'pendingIntents']);
        if (result.latestIntent && !result.latestIntent.processed) {
          setLocalInput(result.latestIntent.text);
          setMessageInput(result.latestIntent.text);
          setDetectedChannel(result.latestIntent.source);
          
          // Mark as processed
          await chrome.storage.local.set({
            latestIntent: { ...result.latestIntent, processed: true }
          });
        }
      } catch (e) {
        // Not in extension context
      }
    };
    
    checkForPendingIntents();
    const interval = setInterval(checkForPendingIntents, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    setLocalInput('');
    setMessageInput('');
    setDetectedChannel(null);
    clearState();
    textareaRef.current?.focus();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Customer Message</h2>
          {detectedChannel && <ChannelBadge source={detectedChannel} />}
        </div>
        {localInput && (
          <button
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={localInput}
        onChange={(e) => {
          setLocalInput(e.target.value);
          setMessageInput(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Paste message here (e.g., 'I want the red tee XL')"
        className="w-full h-28 px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent resize-none text-sm"
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-500">
          {localInput.length}/20 for auto-analyze
        </span>

        <button
          onClick={handleAnalyze}
          disabled={!localInput.trim() || products.length === 0}
          className="px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          Analyze
        </button>
      </div>

      {products.length === 0 && (
        <p className="text-xs text-amber-600 mt-2">
          No products in catalog. Add products to enable analysis.
        </p>
      )}
    </div>
  );
}
