/**
 * Channel Assist Global Store
 * Zustand state management for the application
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types/products';

export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface ProductSuggestion {
  id: string;
  product: Product;
  variant: string | null;
  quantity: number;
  confidence: number;
  matchedOn: string[];
}

export interface HistoryEntry {
  id: string;
  title: string;
  link: string;
  timestamp: number;
}

export interface AppState {
  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  loadProductsFromCache: () => void;
  
  // Message Input
  messageInput: string;
  setMessageInput: (input: string) => void;
  autoCaptured: boolean;
  checkSelection: () => Promise<void>;
  
  // Suggestions
  suggestions: ProductSuggestion[];
  setSuggestions: (suggestions: ProductSuggestion[]) => void;
  selectedSuggestionId: string | null;
  selectSuggestion: (id: string | null) => void;
  
  // Generated Link
  generatedLink: string | null;
  setGeneratedLink: (link: string | null) => void;
  
  // Usage Tracking
  usageCount: number;
  planTier: PlanTier;
  incrementUsage: () => void;
  setPlanTier: (tier: PlanTier) => void;
  
  // Processing State
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  
  // Error State
  error: string | null;
  setError: (error: string | null) => void;
  
  // History
  history: HistoryEntry[];
  addToHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  
  // Detected Context (from passive observer)
  detectedContext: string | null;
  setDetectedContext: (text: string | null) => void;
  clearDetectedContext: () => void;
  
  // Clear State
  clearState: () => void;
}

const initialState = {
  products: [],
  messageInput: '',
  autoCaptured: false,
  suggestions: [],
  selectedSuggestionId: null,
  generatedLink: null,
  usageCount: 0,
  planTier: 'free' as PlanTier,
  isProcessing: false,
  error: null,
  history: [],
  detectedContext: null,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Products
      setProducts: (products) => {
        set({ products });
        // Also persist to localStorage for quick access
        try {
          localStorage.setItem('channel_assist_products', JSON.stringify(products));
        } catch (e) {
          console.error('Failed to cache products:', e);
        }
      },

      addProduct: (product) => {
        const products = get().products;
        set({ products: [...products, product] });
      },

      loadProductsFromCache: () => {
        try {
          const cached = localStorage.getItem('channel_assist_products');
          if (cached) {
            const products = JSON.parse(cached);
            set({ products });
          }
        } catch (e) {
          console.error('Failed to load products from cache:', e);
        }
      },

      // Check for auto-captured text from selection
      checkSelection: async () => {
        try {
          // Check chrome.storage.local for captured text
          if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get(['lastCapturedText', 'captureTimestamp']);
            
            if (result.lastCapturedText) {
              const currentInput = get().messageInput;
              
              // Only set if current input is empty
              if (!currentInput) {
                set({ 
                  messageInput: result.lastCapturedText,
                  autoCaptured: true
                });
                
                // Clear the storage so same text doesn't persist
                await chrome.storage.local.remove(['lastCapturedText', 'captureTimestamp']);
                
                console.log('[Store] Auto-captured text from chat');
              }
            }
          }
        } catch (e) {
          console.error('Failed to check selection:', e);
        }
      },

      // Message Input
      setMessageInput: (messageInput) => set({ messageInput }),

      // Suggestions
      setSuggestions: (suggestions) => set({ suggestions }),
      
      selectSuggestion: (selectedSuggestionId) => set({ selectedSuggestionId }),

      // Generated Link
      setGeneratedLink: (generatedLink) => set({ generatedLink }),

      // Usage
      incrementUsage: () => {
        const { usageCount, planTier } = get();
        const maxUsage = planTier === 'free' ? 10 : planTier === 'pro' ? 100 : Infinity;
        
        if (usageCount < maxUsage) {
          set({ usageCount: usageCount + 1 });
        }
      },

      setPlanTier: (planTier) => set({ planTier }),

      // Processing
      setIsProcessing: (isProcessing) => set({ isProcessing }),

      // Error
      setError: (error) => set({ error }),

      // History
      addToHistory: (entry) => {
        const { history } = get();
        const newEntry: HistoryEntry = {
          ...entry,
          id: `history_${Date.now()}`,
          timestamp: Date.now(),
        };
        // Prepend, limit to 10 items
        const updatedHistory = [newEntry, ...history].slice(0, 10);
        set({ history: updatedHistory });
      },

      // Detected Context (from passive observer)
      setDetectedContext: (text) => set({ detectedContext: text }),
      clearDetectedContext: () => set({ detectedContext: null }),

      // Clear
      clearState: () => set({
        messageInput: '',
        autoCaptured: false,
        suggestions: [],
        selectedSuggestionId: null,
        generatedLink: null,
        isProcessing: false,
        error: null,
        detectedContext: null,
      }),
    }),
    {
      name: 'ordersync-storage',
      partialize: (state) => ({
        products: state.products,
        usageCount: state.usageCount,
        history: state.history,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useProducts = () => useStore((state) => state.products);
export const useMessageInput = () => useStore((state) => state.messageInput);
export const useSuggestions = () => useStore((state) => state.suggestions);
export const useSelectedSuggestion = () => useStore((state) => 
  state.suggestions.find((s) => s.id === state.selectedSuggestionId) || null
);
export const useGeneratedLink = () => useStore((state) => state.generatedLink);
export const useIsProcessing = () => useStore((state) => state.isProcessing);
export const useError = () => useStore((state) => state.error);
export const useUsageCount = () => useStore((state) => state.usageCount);
export const usePlanTier = () => useStore((state) => state.planTier);

// Derived selectors
export const useUsagePercentage = () => {
  const usageCount = useStore((state) => state.usageCount);
  const planTier = useStore((state) => state.planTier);
  const maxUsage = planTier === 'free' ? 10 : planTier === 'pro' ? 100 : 1000;
  return Math.min((usageCount / maxUsage) * 100, 100);
};

export const useCanGenerateLink = () => {
  const usageCount = useStore((state) => state.usageCount);
  const planTier = useStore((state) => state.planTier);
  const selectedSuggestionId = useStore((state) => state.selectedSuggestionId);
  const maxUsage = planTier === 'free' ? 10 : planTier === 'pro' ? 100 : Infinity;
  
  return usageCount < maxUsage && !!selectedSuggestionId;
};
