/**
 * Recent Activity Component
 * Shows last 3 generated links with quick copy functionality
 */

import { useState } from 'react';
import { useStore } from '../hooks/useStore';

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RecentActivity() {
  const history = useStore((state) => state.history);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Show last 3 entries
  const recentItems = history.slice(0, 3);

  const handleQuickCopy = async (link: string, id: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-slate-200 pt-4">
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
        Recent Activity
      </h3>
      
      <div className="space-y-2">
        {recentItems.map((item) => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
          >
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-sm text-slate-700 truncate">
                {item.title}
              </p>
              <p className="text-xs text-slate-400">
                {formatTimeAgo(item.timestamp)}
              </p>
            </div>
            
            <button
              onClick={() => handleQuickCopy(item.link, item.id)}
              className={`flex-shrink-0 p-1.5 rounded transition-colors ${
                copiedId === item.id
                  ? 'text-emerald-600 bg-emerald-100'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title="Quick copy"
            >
              {copiedId === item.id ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
      
      {history.length > 3 && (
        <p className="text-xs text-slate-400 mt-2 text-center">
          +{history.length - 3} more
        </p>
      )}
    </div>
  );
}
