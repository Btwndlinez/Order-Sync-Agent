/**
 * useLeadCapture Hook
 * Antigravity Shadow Mode Logger
 * 
 * Captures leads while running AI category suggestions in the background
 * for accuracy validation before showing to VAs.
 */

import { useState, useCallback, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Initialize Supabase client
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Types
interface LeadData {
  email: string;
  positioning_angle?: string;
  metadata?: Record<string, any>;
}

interface CategorySuggestion {
  category: {
    name: string;
    confidence: number;
    id?: string;
  } | null;
  intent: {
    urgency_score: number;
    priority: 'high' | 'medium' | 'low';
    budget_signal: 'low' | 'high' | 'unknown';
    matched_signals: string[];
  };
  explanation: string;
}

interface ShadowLogPayload {
  message_text: string;
  ai_suggested_id: string | null;
  ai_confidence: number;
  human_selected_id: string;
  is_match: boolean;
  urgency_score?: number;
  budget_signal?: string;
  explanation?: string;
}

interface UseLeadCaptureReturn {
  email: string;
  setEmail: (email: string) => void;
  submitted: boolean;
  loading: boolean;
  error: string;
  aiSuggestion: CategorySuggestion | null;
  isShadowMode: boolean;
  handleEmailChange: (email: string) => void;
  submitLead: (data: LeadData) => Promise<boolean>;
  logHumanSelection: (humanCategoryId: string) => Promise<void>;
  reset: () => void;
}

/**
 * Call the suggest-category Edge Function in the background
 */
async function fetchCategorySuggestion(
  messageText: string,
  sellerId?: string,
  conversationId?: string
): Promise<CategorySuggestion | null> {
  try {
    const { data, error } = await supabase.functions.invoke('suggest-category', {
      body: {
        message_text: messageText,
        seller_id: sellerId,
        conversation_id: conversationId
      }
    });

    if (error) {
      console.warn('Shadow mode - AI suggestion failed:', error);
      return null;
    }

    return data as CategorySuggestion;
  } catch (err) {
    console.warn('Shadow mode - Network error:', err);
    return null;
  }
}

/**
 * Log shadow result to compare AI vs Human selection
 */
async function logShadowResult(
  payload: ShadowLogPayload
): Promise<void> {
  try {
    const { error } = await supabase
      .from('category_suggestions')
      .update({
        human_selected_category_id: payload.human_selected_id,
        updated_at: new Date().toISOString()
      })
      .eq('message_text', payload.message_text)
      .is('human_selected_category_id', null);

    if (error) {
      console.error('Failed to log shadow result:', error);
    }

    // Also POST to log-shadow-result endpoint for external processing
    const { error: endpointError } = await supabase.functions.invoke('log-shadow-result', {
      body: payload
    });

    if (endpointError) {
      console.warn('log-shadow-result endpoint error:', endpointError);
    }
  } catch (err) {
    console.error('Shadow logging error:', err);
  }
}

/**
 * Hook for lead capture with shadow mode AI validation
 */
export function useLeadCapture(
  messageText?: string,
  sellerId?: string,
  conversationId?: string
): UseLeadCaptureReturn {
  // Form state
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Shadow mode state
  const [aiSuggestion, setAiSuggestion] = useState<CategorySuggestion | null>(null);
  const [isShadowMode] = useState(true); // Always shadow mode until >70% accuracy
  
  // Refs to persist data between renders
  const suggestionRef = useRef<CategorySuggestion | null>(null);
  const messageRef = useRef(messageText);

  /**
   * Handle email input change with validation clearing
   */
  const handleEmailChange = useCallback((newEmail: string) => {
    setEmail(newEmail);
    if (error) setError('');
  }, [error]);

  /**
   * Submit lead to waitlist with background AI suggestion
   */
  const submitLead = useCallback(async (data: LeadData): Promise<boolean> => {
    // Validate email
    if (!data.email.trim()) {
      setError('Please enter your email address');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      // ANTIPATTERN: Fire-and-forget AI suggestion (shadow mode)
      // This runs in parallel without blocking the user experience
      if (messageRef.current && isShadowMode) {
        fetchCategorySuggestion(
          messageRef.current,
          sellerId,
          conversationId
        ).then(suggestion => {
          if (suggestion) {
            suggestionRef.current = suggestion;
            setAiSuggestion(suggestion);
            console.log('🥒 Shadow mode - AI suggestion:', suggestion);
          }
        });
      }

      // Primary: Save lead to waitlist
      const { error: supabaseError } = await supabase
        .from('waitlist')
        .insert([{
          email: data.email,
          created_at: new Date().toISOString(),
          positioning_angle: data.positioning_angle || 'unknown',
          metadata: data.metadata || {}
        }]);

      if (supabaseError) {
        setError('Something went wrong. Please try again.');
        console.error('Supabase error:', supabaseError);
        return false;
      }

      // Track analytics
      try {
        if (typeof window !== 'undefined' && (window as any).posthog) {
          (window as any).posthog.capture('waitlist_signup', {
            email: data.email,
            positioning_angle: data.positioning_angle || 'unknown',
            timestamp: new Date().toISOString(),
            ai_suggestion_available: !!suggestionRef.current
          });
        }

        // LocalStorage fallback
        const signupEvents = JSON.parse(localStorage.getItem('ordersync_signup_events') || '[]');
        signupEvents.push({
          email: data.email,
          positioning_angle: data.positioning_angle || 'unknown',
          timestamp: new Date().toISOString(),
          ai_suggestion: suggestionRef.current?.category?.name || null
        });
        localStorage.setItem('ordersync_signup_events', JSON.stringify(signupEvents));
      } catch (trackingError) {
        console.warn('Analytics tracking failed:', trackingError);
      }

      setSubmitted(true);
      return true;

    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Network error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isShadowMode, sellerId, conversationId]);

  /**
   * Log human category selection for accuracy tracking
   * Call this when the user manually selects a category
   */
  const logHumanSelection = useCallback(async (humanCategoryId: string): Promise<void> => {
    if (!messageRef.current || !suggestionRef.current) {
      console.warn('No AI suggestion available to compare');
      return;
    }

    const suggestion = suggestionRef.current;
    const isMatch = suggestion.category?.id === humanCategoryId;

    const payload: ShadowLogPayload = {
      message_text: messageRef.current,
      ai_suggested_id: suggestion.category?.id || null,
      ai_confidence: suggestion.category?.confidence || 0,
      human_selected_id: humanCategoryId,
      is_match: isMatch,
      urgency_score: suggestion.intent.urgency_score,
      budget_signal: suggestion.intent.budget_signal,
      explanation: suggestion.explanation
    };

    // Log immediately for real-time accuracy tracking
    await logShadowResult(payload);

    // Log to console for debugging
    console.log('🥒 Shadow mode - Comparison logged:', {
      ai: suggestion.category?.name,
      human: humanCategoryId,
      match: isMatch,
      confidence: suggestion.category?.confidence
    });

    // Check if we've hit the 70% accuracy threshold
    if (isMatch && suggestion.category && suggestion.category.confidence >= 0.85) {
      console.log('🥒 High confidence match - Consider enabling suggestions');
    }
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setEmail('');
    setSubmitted(false);
    setLoading(false);
    setError('');
    setAiSuggestion(null);
    suggestionRef.current = null;
  }, []);

  return {
    email,
    setEmail,
    submitted,
    loading,
    error,
    aiSuggestion,
    isShadowMode,
    handleEmailChange,
    submitLead,
    logHumanSelection,
    reset
  };
}

export default useLeadCapture;
