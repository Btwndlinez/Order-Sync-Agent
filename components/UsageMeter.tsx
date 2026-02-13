/**
 * Usage Meter
 * Displays usage count with upgrade prompt
 */

import { useStore, useUsagePercentage, usePlanTier } from '../hooks/useStore';

interface UsageMeterProps {
  onUpgrade?: () => void;
}

export default function UsageMeter({ onUpgrade }: UsageMeterProps) {
  const usageCount = useStore((state) => state.usageCount);
  const planTier = usePlanTier();
  const usagePercentage = useUsagePercentage();

  const limits = {
    free: 10,
    pro: 100,
    enterprise: Infinity,
  };

  const limit = limits[planTier] || 10;
  const remaining = limit - usageCount;
  const isUnlimited = planTier === 'enterprise';

  // Determine color based on usage
  let progressColor = 'bg-emerald-500';
  if (usagePercentage >= 80) {
    progressColor = 'bg-red-500';
  } else if (usagePercentage >= 60) {
    progressColor = 'bg-amber-500';
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-700">Usage</h3>
        {!isUnlimited && (
          <button
            onClick={onUpgrade}
            className="text-xs text-[#1877F2] hover:underline font-medium"
          >
            Upgrade
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            {isUnlimited ? (
              <span className="text-emerald-600 font-medium">Unlimited</span>
            ) : (
              <>
                <span className="font-medium text-slate-900">{usageCount}</span>
                <span className="text-slate-500"> / {limit}</span>
              </>
            )}
          </span>
          <span className="text-xs text-slate-500">
            {isUnlimited ? 'Enterprise' : `${remaining} remaining`}
          </span>
        </div>

        {!isUnlimited && (
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all duration-300`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full ${
            planTier === 'free' ? 'bg-slate-100 text-slate-600' :
            planTier === 'pro' ? 'bg-blue-100 text-blue-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {planTier.charAt(0).toUpperCase() + planTier.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
