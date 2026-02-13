import { useState, useEffect, useRef } from 'react';

export interface CategorySuggestion {
  id: string;
  name: string;
  parent: string | null;
  confidence: number;
  description?: string;
}

interface CategoryChipProps {
  suggestedCategories: CategorySuggestion[];
  initialCategoryId?: string;
  leadId: string;
  onFeedbackSubmit?: (feedback: CategoryFeedbackPayload) => Promise<void>;
}

type SelectionStatus = 'suggested' | 'selection' | 'overridden' | 'confirmed';

interface CategoryFeedbackPayload {
  leadId: string;
  final_category_id: string;
  was_correction: boolean;
  ai_suggested_id: string;
  ai_confidence: number;
}

export function CategoryChip({
  suggestedCategories,
  initialCategoryId,
  leadId,
  onFeedbackSubmit
}: CategoryChipProps) {
  const [status, setStatus] = useState<SelectionStatus>('suggested');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(initialCategoryId);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedCategory, setConfirmedCategory] = useState<CategorySuggestion | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const topCategory = suggestedCategories[0];
  const secondCategory = suggestedCategories[1];
  const isMediumConfidence = topCategory && topCategory.confidence >= 0.45 && topCategory.confidence <= 0.75;
  const isHighConfidence = topCategory && topCategory.confidence > 0.75;

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategoryId(initialCategoryId);
      const found = suggestedCategories.find(c => c.id === initialCategoryId);
      if (found) {
        setConfirmedCategory(found);
        setStatus('confirmed');
      }
    }
  }, [initialCategoryId, suggestedCategories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirm = async (category: CategorySuggestion) => {
    setIsSubmitting(true);
    try {
      const wasCorrection = category.id !== topCategory?.id;
      const payload: CategoryFeedbackPayload = {
        leadId,
        final_category_id: category.id,
        was_correction: wasCorrection,
        ai_suggested_id: topCategory?.id || '',
        ai_confidence: topCategory?.confidence || 0
      };

      if (onFeedbackSubmit) {
        await onFeedbackSubmit(payload);
      } else {
        await submitFeedback(payload);
      }

      setSelectedCategoryId(category.id);
      setConfirmedCategory(category);
      setStatus('confirmed');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFeedback = async (payload: CategoryFeedbackPayload) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('[CategoryChip] Feedback payload:', payload);
      return;
    }

    await fetch(`${supabaseUrl}/rest/v1/category_feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        lead_id: payload.leadId,
        final_category_id: payload.final_category_id,
        was_correction: payload.was_correction,
        ai_suggested_id: payload.ai_suggested_id,
        ai_confidence: payload.ai_confidence,
        created_at: new Date().toISOString()
      })
    });
  };

  const handleChange = () => {
    setStatus('overridden');
    setShowDropdown(true);
    setConfirmedCategory(null);
  };

  const handleBack = () => {
    if (isMediumConfidence && secondCategory) {
      setStatus('selection');
    } else {
      setStatus('suggested');
    }
    setShowDropdown(false);
  };

  const filteredCategories = suggestedCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.75) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (confidence >= 0.45) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.75) return 'High';
    if (confidence >= 0.45) return 'Medium';
    return 'Low';
  };

  if (!topCategory) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-500">No categories suggested</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Category</span>
        {status === 'confirmed' && (
          <button
            onClick={handleChange}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Change
          </button>
        )}
      </div>

      {/* Suggested State - High Confidence */}
      {status === 'suggested' && isHighConfidence && (
        <div className="space-y-2">
          <button
            onClick={() => handleConfirm(topCategory)}
            disabled={isSubmitting}
            className="w-full p-4 rounded-lg border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-900">{topCategory.name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(topCategory.confidence)}`}>
                {Math.round(topCategory.confidence * 100)}% {getConfidenceLabel(topCategory.confidence)}
              </span>
            </div>
            {topCategory.description && (
              <p className="text-sm text-emerald-700 mt-1">{topCategory.description}</p>
            )}
          </button>

          <button
            onClick={() => setStatus('overridden')}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-700"
          >
            Choose different category
          </button>
        </div>
      )}

      {/* Selection State - Medium Confidence (Top 2 side by side) */}
      {status === 'suggested' && isMediumConfidence && (
        <button
          onClick={() => setStatus('selection')}
          className="w-full p-4 rounded-lg border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-900">{topCategory.name}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(topCategory.confidence)}`}>
              {Math.round(topCategory.confidence * 100)}%
            </span>
          </div>
          <p className="text-xs text-amber-700 mt-1">Click to see alternatives</p>
        </button>
      )}

      {status === 'selection' && (
        <div className="grid grid-cols-2 gap-2">
          {[topCategory, secondCategory].filter(Boolean).map((cat) => (
            <button
              key={cat!.id}
              onClick={() => handleConfirm(cat!)}
              disabled={isSubmitting}
              className={`p-3 rounded-lg border-2 transition-colors text-left ${
                selectedCategoryId === cat!.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900 text-sm">{cat!.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${getConfidenceColor(cat!.confidence)}`}>
                  {Math.round(cat!.confidence * 100)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Override State - Searchable Dropdown */}
      {status === 'overridden' && (
        <div className="space-y-2">
          <div ref={dropdownRef} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full p-2.5 pr-8 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        handleConfirm(cat);
                        setShowDropdown(false);
                      }}
                      className="w-full p-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 text-sm">{cat.name}</span>
                        {cat.confidence > 0 && (
                          <span className={`px-1.5 py-0.5 rounded text-xs ${getConfidenceColor(cat.confidence)}`}>
                            {Math.round(cat.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-sm text-slate-500 text-center">
                    No categories found
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleBack}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Back to suggestions
          </button>
        </div>
      )}

      {/* Confirmed State */}
      {status === 'confirmed' && confirmedCategory && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-blue-900">{confirmedCategory.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryChip;
