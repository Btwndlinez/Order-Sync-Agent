/**
 * Suggestion Panel
 * Displays product suggestions with disambiguation for low confidence
 */

import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { generateCheckoutLink, checkUsageLimit } from '../utils/apiHandlers';

export default function SuggestionPanel() {
  const {
    suggestions,
    selectedSuggestionId,
    selectSuggestion,
    generatedLink,
    setGeneratedLink,
    isProcessing,
    usageCount,
    planTier,
    incrementUsage,
    addToHistory,
    clearState,
  } = useStore();

  const [copied, setCopied] = useState(false);

  // Get selected suggestion
  const selectedSuggestion = suggestions.find((s) => s.id === selectedSuggestionId);

  // Check if we need disambiguation (low confidence)
  const needsDisambiguation = suggestions.length > 0 && 
    suggestions[0].confidence < 0.7 && 
    !selectedSuggestionId;

  const handleSelectSuggestion = (id: string) => {
    selectSuggestion(id);
  };

  const handleGenerateLink = () => {
    if (!selectedSuggestion) return;

    // Check usage limits
    const limitCheck = checkUsageLimit(usageCount, planTier);
    if (!limitCheck.allowed) {
      alert(limitCheck.message);
      return;
    }

    const link = generateCheckoutLink(
      selectedSuggestion.product,
      selectedSuggestion.quantity,
      selectedSuggestion.variant
    );

    setGeneratedLink(link);
    incrementUsage();
    
    // Add to history
    addToHistory({
      title: selectedSuggestion.product.name,
      link: link,
    });
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReset = () => {
    clearState();
  };

  if (isProcessing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Analyzing message...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <p className="text-slate-500 text-sm">
          Enter a customer message and click Analyze to see product suggestions.
        </p>
      </div>
    );
  }

  // Disambiguation view (low confidence)
  if (needsDisambiguation) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 text-amber-600 text-sm mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Multiple matches found - please select
        </div>

        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <label
              key={suggestion.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedSuggestionId === suggestion.id
                  ? 'border-[#1877F2] bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="suggestion"
                checked={selectedSuggestionId === suggestion.id}
                onChange={() => handleSelectSuggestion(suggestion.id)}
                className="mt-1 text-[#1877F2] focus:ring-[#1877F2]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{suggestion.product.name}</p>
                  <span className="text-xs text-slate-500">
                    {Math.round(suggestion.confidence * 100)}% match
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  SKU: {suggestion.product.sku} • ${suggestion.product.price.toFixed(2)}
                  {suggestion.variant && ` • ${suggestion.variant}`}
                  {suggestion.quantity > 1 && ` • Qty: ${suggestion.quantity}`}
                </p>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleGenerateLink}
          disabled={!selectedSuggestionId}
          className="w-full mt-4 py-2.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
        >
          Confirm & Generate Link
        </button>
      </div>
    );
  }

  // Suggestion card view (high confidence)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-emerald-600 text-sm mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Order Detected
      </div>

      {selectedSuggestion && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Product</p>
            <p className="font-semibold text-slate-900">{selectedSuggestion.product.name}</p>
          </div>

          <div className="flex gap-4">
            {selectedSuggestion.variant && (
              <div className="p-3 bg-slate-50 rounded-lg flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Variant</p>
                <p className="text-sm text-slate-700 capitalize">{selectedSuggestion.variant}</p>
              </div>
            )}
            <div className="p-3 bg-slate-50 rounded-lg flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Quantity</p>
              <p className="text-sm text-slate-700">{selectedSuggestion.quantity}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold text-[#1877F2]">
              ${(selectedSuggestion.product.price * selectedSuggestion.quantity).toFixed(2)}
            </p>
          </div>

          {generatedLink && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-2 py-1 bg-white border border-emerald-200 rounded text-xs font-mono text-slate-700"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#1877F2] hover:bg-[#166fe5] text-white'
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </span>
                )}
              </button>
            </div>
          )}

          <button
            onClick={generatedLink ? handleReset : handleGenerateLink}
            className={`w-full py-2.5 px-4 font-medium rounded-lg transition-colors text-sm ${
              generatedLink
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#1877F2] hover:bg-[#166fe5] text-white'
            }`}
          >
            {generatedLink ? 'Process Another' : 'Generate Link'}
          </button>
        </div>
      )}
    </div>
  );
}
