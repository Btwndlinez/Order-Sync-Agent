export const BrandLogo = () => {
  return (
    <div className="flex items-center gap-2">
      <img 
        src="/brand/logo-v1-final.png" 
        onError={(e) => (e.currentTarget.style.display = 'none')} 
        className="h-8 w-auto" 
      />
      <span className="font-bold text-slate-900 text-lg tracking-tight">
        Order Sync <span className="text-blue-600">Agent</span>
      </span>
    </div>
  );
};
