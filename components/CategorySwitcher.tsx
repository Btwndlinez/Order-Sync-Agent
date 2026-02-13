import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Category {
  id: string;
  name: string;
  parent?: string;
  isAiSuggested?: boolean;
}

interface CategorySwitcherProps {
  currentCategory?: Category;
  suggestedCategories: Category[];
  recentCategories: Category[];
  allCategories: Category[];
  leadId: string;
  onSelect: (category: Category) => void;
}

type InteractionType = 'keyboard_shortcut' | 'mouse_click';

interface AnalyticsEvent {
  type: InteractionType;
  time_to_select_ms: number;
  category_id: string;
  lead_id: string;
}

export function CategorySwitcher({
  currentCategory,
  suggestedCategories,
  recentCategories,
  allCategories,
  leadId,
  onSelect
}: CategorySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggested = suggestedCategories.slice(0, 3);
  const recent = recentCategories.slice(0, 5);
  
  const filteredAll = allCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const allItems = [
    ...suggested.map(c => ({ ...c, section: 'suggested' })),
    ...recent.map(c => ({ ...c, section: 'recent' })),
    ...filteredAll.map(c => ({ ...c, section: 'all' }))
  ];

  const totalItems = allItems.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' && !isOpen && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          openPalette();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    } else {
      setStartTime(Date.now());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => (i + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => (i - 1 + totalItems) % totalItems);
          break;
        case 'Enter':
          e.preventDefault();
          if (allItems[selectedIndex]) {
            handleSelect(allItems[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closePalette();
          break;
        case '1':
        case '2':
        case '3':
          if (suggested[parseInt(e.key) - 1]) {
            e.preventDefault();
            handleSelect(suggested[parseInt(e.key) - 1]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, totalItems, suggested, allItems]);

  const openPalette = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closePalette = () => {
    setIsOpen(false);
  };

  const handleSelect = (category: Category) => {
    const timeToSelect = Date.now() - startTime;
    
    const event: AnalyticsEvent = {
      type: 'keyboard_shortcut',
      time_to_select_ms: timeToSelect,
      category_id: category.id,
      lead_id: leadId
    };
    
    console.log('[CategorySwitcher] track_interaction:', event);
    
    onSelect(category);
    closePalette();
  };

  const handleMouseClick = (category: Category) => {
    const timeToSelect = Date.now() - startTime;
    
    const event: AnalyticsEvent = {
      type: 'mouse_click',
      time_to_select_ms: timeToSelect,
      category_id: category.id,
      lead_id: leadId
    };
    
    console.log('[CategorySwitcher] track_interaction:', event);
    
    onSelect(category);
    closePalette();
  };

  const getSectionLabel = (section: string) => {
    switch (section) {
      case 'suggested': return '✨ Suggested';
      case 'recent': return '🕐 Recent';
      case 'all': return '📁 All Categories';
      default: return '';
    }
  };

  let currentSection = '';

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={openPalette}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
      >
        <span className="font-medium text-slate-700">
          {currentCategory?.name || 'Select Category'}
        </span>
        {currentCategory?.isAiSuggested && (
          <span className="text-xs">✨</span>
        )}
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-slate-400 bg-slate-200 rounded">
          C
        </kbd>
      </button>

      {/* Command Palette */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-slate-100">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search categories..."
                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto">
              {allItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No categories found
                </div>
              ) : (
                allItems.map((item, idx) => {
                  const isNewSection = item.section !== currentSection;
                  currentSection = item.section;

                  return (
                    <div key={item.id}>
                      {isNewSection && (
                        <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase bg-slate-50">
                          {getSectionLabel(item.section)}
                        </div>
                      )}
                      <button
                        onClick={() => handleMouseClick(item)}
                        className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors ${
                          selectedIndex === idx
                            ? 'bg-blue-50 text-blue-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="font-medium text-sm">{item.name}</span>
                        <div className="flex items-center gap-2">
                          {item.section === 'suggested' && (
                            <span className="text-xs text-slate-400">
                              {idx < 3 && `Press ${idx + 1}`}
                            </span>
                          )}
                          {item.isAiSuggested && (
                            <span className="text-xs">✨</span>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white rounded border">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white rounded border">↵</kbd> Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white rounded border">esc</kbd> Close
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closePalette}
        />
      )}
    </div>
  );
}

export default CategorySwitcher;
