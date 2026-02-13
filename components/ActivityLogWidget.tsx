import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

interface ActivityLog {
  id: string;
  action: string;
  product_name?: string;
  message_preview?: string;
  created_at: string;
}

interface ActivityLogWidgetProps {
  limit?: number;
}

export function ActivityLogWidget({ limit = 5 }: ActivityLogWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !logs.length) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    if (!supabase) {
      setLogs(getMockLogs());
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.warn('Failed to fetch activity logs:', err);
      setLogs(getMockLogs());
    } finally {
      setLoading(false);
    }
  };

  const getMockLogs = (): ActivityLog[] => [
    { id: '1', action: 'push_to_chat', product_name: 'Blue Hoodie', message_preview: 'Hi! I want to buy...', created_at: new Date().toISOString() },
    { id: '2', action: 'link_copied', product_name: 'Red T-Shirt', created_at: new Date(Date.now() - 60000).toISOString() },
    { id: '3', action: 'category_selected', product_name: 'Black Jeans', created_at: new Date(Date.now() - 120000).toISOString() },
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'push_to_chat':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'link_copied':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        );
      case 'category_selected':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {loading ? (
            <div className="text-center py-4 text-sm text-slate-400">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-4 text-sm text-slate-400">No recent activity</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="mt-0.5">{getActionIcon(log.action)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {log.product_name || log.action.replace(/_/g, ' ')}
                  </p>
                  {log.message_preview && (
                    <p className="text-xs text-slate-400 truncate">"{log.message_preview}"</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatTime(log.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ActivityLogWidget;
