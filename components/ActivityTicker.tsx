import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

interface VAActivity {
  id: string;
  va_id: string;
  action: 'push_to_chat' | 'copy_link' | 'category_select' | 'dismiss';
  product_name?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface ActivityTickerProps {
  vaId?: string;
  maxItems?: number;
}

export function ActivityTicker({ vaId = 'default', maxItems = 5 }: ActivityTickerProps) {
  const [activities, setActivities] = useState<VAActivity[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchActivities();
    
    // Poll for new activities every 5 seconds
    const interval = setInterval(fetchActivities, 5000);
    return () => clearInterval(interval);
  }, [vaId]);

  const fetchActivities = async () => {
    if (!supabase) {
      setActivities(getMockActivities());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('va_activity')
        .select('*')
        .eq('va_id', vaId)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.warn('Failed to fetch VA activities:', err);
      setActivities(getMockActivities());
    }
  };

  const logActivity = async (
    action: VAActivity['action'],
    productName?: string,
    metadata?: Record<string, any>
  ) => {
    const activity = {
      va_id: vaId,
      action,
      product_name: productName,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        await supabase.from('va_activity').insert(activity);
        setActivities(prev => [activity as any, ...prev.slice(0, maxItems - 1)]);
      } catch (err) {
        console.warn('Failed to log activity:', err);
      }
    } else {
      setActivities(prev => [activity as any, ...prev.slice(0, maxItems - 1)]);
    }
  };

  const getMockActivities = (): VAActivity[] => [
    { id: '1', va_id: 'default', action: 'push_to_chat', product_name: 'Blue Hoodie', created_at: new Date().toISOString() },
    { id: '2', va_id: 'default', action: 'copy_link', product_name: 'Red T-Shirt', created_at: new Date(Date.now() - 30000).toISOString() },
    { id: '3', va_id: 'default', action: 'category_select', product_name: 'Order Intent', created_at: new Date(Date.now() - 60000).toISOString() },
  ];

  const getActionIcon = (action: VAActivity['action']) => {
    switch (action) {
      case 'push_to_chat':
        return <span className="text-green-500">↑</span>;
      case 'copy_link':
        return <span className="text-blue-500">⧉</span>;
      case 'category_select':
        return <span className="text-purple-500">#</span>;
      default:
        return <span className="text-slate-400">•</span>;
    }
  };

  const formatTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return `${Math.floor(diff / 3600000)}h`;
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-xs text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Activity
        </span>
        <span className="flex items-center gap-1">
          <span>{activities.length} events</span>
          <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isExpanded && (
        <div className="max-h-48 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-400">
              No activity yet
            </div>
          ) : (
            <div className="space-y-0.5">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="px-3 py-1.5 flex items-center gap-2 text-xs hover:bg-slate-100 transition-colors"
                >
                  <span className="w-4 text-center">{getActionIcon(activity.action)}</span>
                  <span className="flex-1 truncate text-slate-600">
                    {activity.product_name || activity.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-400 whitespace-nowrap">
                    {formatTime(activity.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export logging function for use in components
export const useVAActivity = (vaId?: string) => {
  const log = async (
    action: VAActivity['action'],
    productName?: string,
    metadata?: Record<string, any>
  ) => {
    console.log('[VAActivity]', { action, productName, metadata });
    // In production, this would call the ActivityTicker's logActivity
  };

  return { log };
};

export default ActivityTicker;
