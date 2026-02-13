import React, { useState, useEffect } from 'react';

interface JoyrideStep {
  target: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  onComplete?: () => void;
}

const STORAGE_KEY = 'ordersync_onboarding_complete';

const TOUR_STEPS: JoyrideStep[] = [
  {
    target: '.wa-detection-pill',
    placement: 'bottom',
    content: (
      <div className="max-w-xs">
        <h3 className="font-semibold text-slate-900 mb-1">✨ Order Detected</h3>
        <p className="text-sm text-slate-600">
          When customers show purchase intent, this pill appears. Click "View" to see suggestions.
        </p>
      </div>
    )
  },
  {
    target: '.suggestion-card',
    placement: 'left',
    content: (
      <div className="max-w-xs">
        <h3 className="font-semibold text-slate-900 mb-1">🎯 Smart Suggestions</h3>
        <p className="text-sm text-slate-600">
          AI suggests products based on the message. High confidence = one-click link generation.
        </p>
      </div>
    )
  },
  {
    target: '.btn-push-to-chat',
    placement: 'top',
    content: (
      <div className="max-w-xs">
        <h3 className="font-semibold text-slate-900 mb-1">🚀 Push to Chat</h3>
        <p className="text-sm text-slate-600">
          Send the checkout link directly to WhatsApp. The customer gets a ready-to-pay link.
        </p>
      </div>
    )
  },
  {
    target: '.hotkey-legend',
    placement: 'top',
    content: (
      <div className="max-w-xs">
        <h3 className="font-semibold text-slate-900 mb-1">⚡ Keyboard Shortcuts</h3>
        <p className="text-sm text-slate-600">
          Press <kbd className="px-1 bg-slate-100 rounded text-xs">C</kbd> to open category selector,
          <kbd className="px-1 bg-slate-100 rounded text-xs ml-1">1</kbd>
          <kbd className="px-1 bg-slate-100 rounded text-xs ml-1">2</kbd> for quick selection.
        </p>
      </div>
    )
  }
];

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isComplete, setIsComplete] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if onboarding is complete
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsComplete(false);
      setShowTour(true);
      setCurrentStep(0);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowTour(false);
    setIsComplete(true);
    onComplete?.();
  };

  if (isComplete || !showTour) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" />

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl p-4 max-w-sm animate-in fade-in zoom-in duration-200">
          {step.content}
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <button
                onClick={handleNext}
                className="px-3 py-1.5 bg-[#1877F2] text-white text-sm font-medium rounded-lg hover:bg-[#166fe5] transition-colors"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}

export default OnboardingTour;
