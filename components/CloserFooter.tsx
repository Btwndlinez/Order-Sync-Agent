import React, { useState, useEffect } from 'react';

interface CloserFooterProps {
  timeSavedSeconds?: number;
}

export function CloserFooter({ timeSavedSeconds = 0 }: CloserFooterProps) {
  const [animatedSeconds, setAnimatedSeconds] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 20;
    const increment = timeSavedSeconds / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= timeSavedSeconds) {
        setAnimatedSeconds(timeSavedSeconds);
        clearInterval(timer);
      } else {
        setAnimatedSeconds(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [timeSavedSeconds]);

  const minutes = Math.floor(animatedSeconds / 60);
  const seconds = animatedSeconds % 60;

  return (
    <div className="border-t border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Time Saved Today</p>
            <p className="text-lg font-bold text-green-700">
              {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Order Sync Agent</p>
          <p className="text-xs text-green-600 font-medium">VA Powered</p>
        </div>
      </div>
    </div>
  );
}

export default CloserFooter;
