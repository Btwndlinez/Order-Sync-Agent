/**
 * StickyCTABar Component
 * Mobile-Only Floating Call-to-Action Bar
 * Appears on screens < 768px (mobile)
 */

import { useState, useEffect } from 'react'

interface StickyCTABarProps {
  onClick: () => void
  buttonText?: string
  subtext?: string
}

export function StickyCTABar({ 
  onClick, 
  buttonText = "Join Waitlist",
  subtext = "Limited early access spots available"
}: StickyCTABarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkMobile()

    // Show bar after user scrolls down a bit (engagement signal)
    const handleScroll = () => {
      const scrollY = window.scrollY
      // Show after scrolling 300px (past hero)
      setIsVisible(scrollY > 300 && window.innerWidth < 768)
    }

    window.addEventListener('resize', checkMobile)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Check initial scroll position
    handleScroll()

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Don't render if not mobile
  if (!isMobile) return null

  return (
    <div 
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-white border-t border-slate-200
        shadow-[0_-4px_20px_rgba(0,0,0,0.1)]
        transform transition-transform duration-300 ease-out
        md:hidden
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {buttonText}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {subtext}
            </p>
          </div>
          <button
            onClick={onClick}
            className="
              bg-blue-600 hover:bg-blue-700 
              text-white font-semibold
              px-6 py-3 rounded-xl
              shadow-lg shadow-blue-500/30
              active:scale-95 transition-transform
              whitespace-nowrap
              text-sm
            "
          >
            {buttonText}
          </button>
        </div>
      </div>
      
      {/* Safe area padding for iPhone X+ */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}

export default StickyCTABar
