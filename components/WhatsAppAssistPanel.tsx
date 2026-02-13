/**
 * WhatsApp Assist Panel
 * High-velocity side panel for order extraction and link generation
 */

import React, { useState, useEffect, useRef } from 'react';
import { searchProducts } from '../utils/vectorSearch';
import type { Product } from '../types/products';

const BRAND_BLUE = '#1877F2';
const BACKGROUND_GRAY = '#F3F4F6';

interface ExtractedIntent {
  productName: string;
  variant: string | null;
  quantity: number;
  confidence: number;
}

interface WhatsAppAssistPanelProps {
  products: Product[];
  onProductMatch?: (product: Product) => void;
  onLinkGenerated?: (link: string) => void;
}

type PanelView = 'input' | 'suggestion' | 'disambiguation';

export default function WhatsAppAssistPanel({ 
  products, 
  onProductMatch,
  onLinkGenerated 
}: WhatsAppAssistPanelProps) {
  const [view, setView] = useState<PanelView>('input');
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedIntent, setExtractedIntent] = useState<ExtractedIntent | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [disambigOptions, setDisambigOptions] = useState<Product[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-detect: trigger extraction at 20+ characters
  useEffect(() => {
    if (inputValue.length >= 20 && view === 'input') {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
      inputTimeoutRef.current = setTimeout(() => {
        handleExtractIntent();
      }, 500); // Debounce 500ms
    }

    return () => {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, [inputValue, view]);

  // Keyboard shortcut: Cmd/Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (view === 'suggestion' || view === 'disambiguation') {
          handleGenerateLink();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, matchedProduct, selectedOption, disambigOptions]);

  const handleExtractIntent = async () => {
    if (!inputValue.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Extract intent using simple pattern matching (replace with LLM later)
      const intent = await extractIntentFromMessage(inputValue);
      setExtractedIntent(intent);

      // Search for product matches
      const results = await searchProducts(products, intent.productName, {
        useVector: true,
        threshold: 0.5,
        limit: 5
      });

      if (results.length === 0) {
        setError('No matching products found');
        setView('input');
        return;
      }

      // Check confidence threshold - Three-tier gating
      if (intent.confidence > 0.75) {
        // High confidence (>0.75): Direct Suggestion Card
        const bestMatch = results[0];
        setMatchedProduct(bestMatch.product);
        setView('suggestion');
        onProductMatch?.(bestMatch.product);
      } else if (intent.confidence >= 0.45 && intent.confidence <= 0.75) {
        // Medium confidence (0.45-0.75): Disambiguation Modal
        setDisambigOptions(results.slice(0, 3).map(r => r.product));
        setSelectedOption(null);
        setView('disambiguation');
      } else {
        // Low confidence (<0.45): Manual Search/Input
        setError('Not confident enough. Please search manually.');
        setView('input');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract intent');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractIntentFromMessage = async (message: string): Promise<ExtractedIntent> => {
    const lowerMessage = message.toLowerCase();

    // Simple pattern matching (replace with LLM integration)
    let quantity = 1;
    const quantityPatterns: { regex: RegExp; extract: (m: string, q?: string) => number }[] = [
      { regex: /(\d+)\s*(x|times)/i, extract: (_m: string, qty?: string) => parseInt(qty || '1') },
      { regex: /(\d+)\s*(pcs?|pieces?)/i, extract: (_m: string, qty?: string) => parseInt(qty || '1') },
      { regex: /(one|two|three|four|five|six|seven|eight|nine|ten)/i, extract: (match: string) => {
        const numMap: Record<string, number> = {
          one: 1, two: 2, three: 3, four: 4, five: 5,
          six: 6, seven: 7, eight: 8, nine: 9, ten: 10
        };
        return numMap[match.toLowerCase()] || 1;
      }}
    ];

    for (const pattern of quantityPatterns) {
      const match = lowerMessage.match(pattern.regex);
      if (match) {
        quantity = pattern.extract(match[0], match[1]);
        break;
      }
    }

    // Extract variant (size/color)
    const variantPatterns = [
      /(small|medium|large|xl|xxl|xs)/i,
      /(red|blue|green|black|white|pink|purple|yellow|orange)/i,
      /(s|m|l|xl|xxl|xs)/i
    ];

    let variant: string | null = null;
    for (const pattern of variantPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        variant = match[0];
        break;
      }
    }

    // Calculate confidence based on extracted info
    let confidence = 0.5;
    if (variant) confidence += 0.2;
    if (quantity > 1) confidence += 0.1;
    if (inputValue.length > 50) confidence += 0.1;

    // Extract product name (simplified - take text between action verbs and quantities)
    const productMatch = lowerMessage.match(/(?:want|need|buy|order|get|take|like)\s+(?:the\s+)?(.+?)(?:\s+(?:for|at|in|size|color|qty|quantity)|$)/i);
    const productName = productMatch ? productMatch[1].trim() : inputValue.substring(0, 30);

    return {
      productName,
      variant,
      quantity,
      confidence: Math.min(confidence, 1)
    };
  };

  const handleDisambiguationSelect = (productId: string) => {
    setSelectedOption(productId);
    const product = disambigOptions.find(p => p.id === productId);
    if (product) {
      setMatchedProduct(product);
    }
  };

  const handleGenerateLink = async () => {
    const product = matchedProduct;
    if (!product) return;

    // Generate cart link
    const storeUrl = localStorage.getItem('channel_assist_store_url') || 'https://your-store.com';
    const link = `${storeUrl}/cart/${product.sku}:${extractedIntent?.quantity || 1}`;

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      onLinkGenerated?.(link);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy link');
    }
  };

  const handleReset = () => {
    setView('input');
    setInputValue('');
    setExtractedIntent(null);
    setMatchedProduct(null);
    setDisambigOptions([]);
    setSelectedOption(null);
    setCopied(false);
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div 
      className="w-[350px] min-h-[500px] flex flex-col"
      style={{ backgroundColor: BACKGROUND_GRAY }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill={BRAND_BLUE}>
            <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.767.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.518.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.57-.015-.2 0-.523.074-.797.372-.273.297-.98 1.015-.98 2.479 0 1.463 1.004 2.88 1.146 3.082.144.2 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.714.227 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004c0-1.306-.01-2.617-.01-3.945 0-1.306.01-2.617.01-3.945h-.004l-.025-2.075c-.137-1.114-.788-2.232-1.875-2.832l-1.088-.572c-.038-.02-.077-.038-.116-.056-.04-.018-.082-.036-.125-.054l-.01-.004c-.463-.2-.936-.3-1.422-.3h-.078c-.485 0-.96.1-1.422.3l-.01.004c-.043.018-.085.036-.125.054-.04.018-.078.036-.116.056l-1.088.572c-1.087.6-1.738 1.718-1.875 2.832l-.025 2.075h-.004c0 1.306-.01 2.617-.01 3.945 0 1.306.01 2.617.01 3.945h.004l.025 2.075c.137 1.114.788 2.232 1.875 2.832l1.088.572c.038.02.077.038.116.056.04.018.082.036.125.054l.01.004c.463.2.936.3 1.422.3h.078c.485 0 .96-.1 1.422-.3l.01-.004c.043-.018.085-.036.125-.054.04-.018.078-.036.116-.056l1.088-.572c1.087-.6 1.738-1.718 1.875-2.832l.025-2.075h.004z"/>
          </svg>
          <span className="font-semibold text-slate-900">WhatsApp Assist</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {view === 'input' && (
          <InputView
            inputValue={inputValue}
            onChange={setInputValue}
            onSubmit={handleExtractIntent}
            isProcessing={isProcessing}
            error={error}
            textareaRef={textareaRef}
          />
        )}

        {view === 'suggestion' && matchedProduct && extractedIntent && (
          <SuggestionView
            product={matchedProduct}
            variant={extractedIntent.variant}
            quantity={extractedIntent.quantity}
            onGenerateLink={handleGenerateLink}
            onReset={handleReset}
            copied={copied}
            isProcessing={isProcessing}
          />
        )}

        {view === 'disambiguation' && (
          <DisambiguationView
            options={disambigOptions}
            selectedOption={selectedOption}
            onSelect={handleDisambiguationSelect}
            onConfirm={handleGenerateLink}
            onReset={handleReset}
            isProcessing={isProcessing}
            copied={copied}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 text-xs text-slate-400 text-center">
        Cmd/Ctrl + Enter to generate link
      </div>
    </div>
  );
}

// Sub-components

function InputView({ 
  inputValue, 
  onChange, 
  onSubmit, 
  isProcessing, 
  error,
  textareaRef 
}: { 
  inputValue: string; 
  onChange: (v: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  error: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <div className="space-y-4">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste message here (e.g., 'I want the red tee XL')"
        className="w-full h-40 px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1877F2] resize-none text-sm"
        disabled={isProcessing}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={isProcessing || inputValue.length < 5}
        className="w-full py-2.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : (
          'Extract Order'
        )}
      </button>

      <p className="text-xs text-slate-500 text-center">
        {inputValue.length}/20 characters for auto-detect
      </p>
    </div>
  );
}

function SuggestionView({
  product,
  variant,
  quantity,
  onGenerateLink,
  onReset,
  copied,
  isProcessing
}: {
  product: Product;
  variant: string | null;
  quantity: number;
  onGenerateLink: () => void;
  onReset: () => void;
  copied: boolean;
  isProcessing: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Success indicator */}
      <div className="flex items-center gap-2 text-emerald-600 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Order Detected
      </div>

      {/* Suggestion Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Product</p>
            <p className="font-semibold text-slate-900">{product.name}</p>
          </div>
          
          <div className="flex gap-4">
            {variant && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Variant</p>
                <p className="text-sm text-slate-700 capitalize">{variant}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Quantity</p>
              <p className="text-sm text-slate-700">{quantity}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Price</p>
            <p className="text-lg font-bold text-[#1877F2]">${product.price.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onGenerateLink}
          disabled={isProcessing}
          className={`w-full py-2.5 px-4 font-medium rounded-lg transition-all text-sm flex items-center justify-center gap-2 ${
            copied 
              ? 'bg-emerald-500 text-white' 
              : 'bg-[#1877F2] hover:bg-[#166fe5] text-white'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Link Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </button>

        <button
          onClick={onReset}
          className="w-full py-2 px-4 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm"
        >
          Process Another
        </button>
      </div>
    </div>
  );
}

function DisambiguationView({
  options,
  selectedOption,
  onSelect,
  onConfirm,
  onReset,
  isProcessing,
  copied
}: {
  options: Product[];
  selectedOption: string | null;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onReset: () => void;
  isProcessing: boolean;
  copied: boolean;
}) {
  const optionRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

  // Keyboard navigation: Arrow keys + Enter
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedIndex === -1) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => {
            const next = Math.min(prev + 1, options.length - 1);
            optionRefs.current[next]?.focus();
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => {
            const next = Math.max(prev - 1, 0);
            optionRefs.current[next]?.focus();
            return next;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedOption && !isProcessing) {
            onConfirm();
          } else if (focusedIndex >= 0) {
            onSelect(options[focusedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, selectedOption, options, isProcessing, onConfirm, onSelect, onReset]);

  const handleOptionClick = (id: string, idx: number) => {
    onSelect(id);
    setFocusedIndex(idx);
    optionRefs.current[idx]?.focus();
  };

  return (
    /* Glassmorphism Modal */
    <div className="relative">
      {/* Glassmorphism backdrop */}
      <div className="absolute -inset-2 bg-white/80 backdrop-blur-lg rounded-xl shadow-xl shadow-slate-200/50 -z-10" />
      
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 space-y-4 border border-white/50">
        {/* Header with warning */}
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">Multiple matches found</span>
        </div>

        <p className="text-sm text-slate-600">
          Select the correct product or use arrow keys to navigate:
        </p>

        {/* Options List with keyboard support */}
        <div className="space-y-2" role="radiogroup" aria-label="Product options">
          {options.map((product, idx) => (
            <button
              ref={(el) => { optionRefs.current[idx] = el; }}
              key={product.id}
              onClick={() => handleOptionClick(product.id, idx)}
              onFocus={() => setFocusedIndex(idx)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all text-left ${
                selectedOption === product.id || focusedIndex === idx
                  ? 'border-[#1877F2] bg-blue-50/80 shadow-md shadow-blue-100'
                  : 'border-slate-200/80 hover:border-slate-300 bg-white/60 hover:bg-white'
              }`}
              role="radio"
              aria-checked={selectedOption === product.id}
              tabIndex={0}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedOption === product.id
                  ? 'border-[#1877F2] bg-[#1877F2]'
                  : 'border-slate-300'
              }`}>
                {selectedOption === product.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-500">
                  SKU: {product.sku} • ${product.price.toFixed(2)}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onConfirm}
            disabled={!selectedOption || isProcessing}
            className={`w-full py-2.5 px-4 font-medium rounded-lg transition-all text-sm flex items-center justify-center gap-2 ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-slate-300 text-white'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Link Copied!
              </>
            ) : (
              'Confirm Selection'
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="flex-1 py-2 px-4 border border-slate-200/80 text-slate-600 font-medium rounded-lg hover:bg-slate-50/80 transition-colors text-sm"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                onReset();
              }}
              className="flex-1 py-2 px-4 text-slate-500 font-medium text-sm hover:text-slate-700 transition-colors"
            >
              None of these
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
