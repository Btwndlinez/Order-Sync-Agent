import React from 'react';

interface HapticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success';
  hapticFeedback?: boolean;
  children: React.ReactNode;
}

export function HapticButton({
  variant = 'primary',
  hapticFeedback = true,
  children,
  onClick,
  disabled,
  className = '',
  ...props
}: HapticButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    if (hapticFeedback && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    
    onClick?.(e);
  };

  const variantClasses = {
    primary: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white'
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden px-8 py-4 rounded-lg font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {hapticFeedback && !disabled && (
        <span className="absolute inset-0 bg-white/20 animate-ping opacity-0" style={{ animationDuration: '150ms' }} />
      )}
    </button>
  );
}

export function triggerHaptic(pattern: number | number[] = 10) {
  if (window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
}

export default HapticButton;
