/**
 * Header Component - Sticky Navigation with Logo
 * Responsive logo sizing: Mobile 36px, Desktop 44px
 * Facebook brand colors integrated
 */

import { useState } from "react"

interface HeaderProps {
  onOpenWaitlist: () => void
}

export default function Header({ onOpenWaitlist }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <img 
              src="/brand/logo-v1-final.png" 
              alt="Order Sync Agent Logo" 
              className="h-9 w-9 md:h-11 md:w-11"
            />
            <span className="font-semibold text-xl text-slate-900">Order Sync Agent</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#about" 
              className="text-slate-600 hover:text-[#1877F2] font-medium transition-colors"
            >
              About
            </a>
            <a 
              href="#demo" 
              className="text-slate-600 hover:text-[#1877F2] font-medium transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#pricing" 
              className="text-slate-600 hover:text-[#1877F2] font-medium transition-colors"
            >
              Pricing
            </a>
            <button
              onClick={onOpenWaitlist}
              className="bg-[#1877F2] hover:bg-[#166fe5] hover:scale-105 text-white px-5 py-2 rounded-lg font-medium transition-all transform"
            >
              Get Started
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg 
              className="w-6 h-6 text-slate-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200">
            <nav className="flex flex-col space-y-3">
              <a 
                href="#about" 
                className="text-slate-600 hover:text-[#1877F2] font-medium"
              >
                About
              </a>
              <a 
                href="#demo" 
                className="text-slate-600 hover:text-[#1877F2] font-medium"
              >
                How It Works
              </a>
              <a 
                href="#pricing" 
                className="text-slate-600 hover:text-[#1877F2] font-medium"
              >
                Pricing
              </a>
              <button
                onClick={() => {
                  onOpenWaitlist()
                  setMobileMenuOpen(false)
                }}
                className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-5 py-3 rounded-lg font-medium w-full"
              >
                Get Started
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}