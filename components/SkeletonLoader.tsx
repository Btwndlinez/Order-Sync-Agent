import React from 'react';

export function SkeletonLoader({ type = 'card' }: { type?: 'card' | 'list' | 'table' }) {
  if (type === 'card') {
    return (
      <div className="animate-pulse flex flex-col space-y-3 p-4 border border-slate-100 rounded-xl bg-white">
        <div className="h-32 bg-slate-200 rounded-lg w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="flex gap-2 mt-2">
          <div className="h-8 bg-slate-200 rounded-lg flex-1"></div>
          <div className="h-8 bg-slate-200 rounded-lg w-16"></div>
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg">
            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-6 bg-slate-200 rounded w-1/3"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-slate-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`relative overflow-hidden bg-slate-200 rounded ${className}`}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    >
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

export default SkeletonLoader;
