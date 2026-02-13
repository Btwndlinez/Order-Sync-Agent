/**
 * Waitlist Modal - Lead Generation Component
 * Clean email capture for invite-only mode with UTM tracking
 */

import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
  positioningAngle?: string
  exitIntentMode?: boolean // When true, shows exit intent headline
}

/**
 * Parse UTM parameters from URL
 */
function getUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {}
  
  const urlParams = new URLSearchParams(window.location.search)
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    utm_term: urlParams.get('utm_term') || undefined
  }
}

export default function WaitlistModal({ isOpen, onClose, positioningAngle, exitIntentMode = false }: WaitlistModalProps) {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [utmParams, setUtmParams] = useState<UTMParams>({})

  // Capture UTM params when modal opens
  useEffect(() => {
    if (isOpen) {
      const params = getUTMParams()
      setUtmParams(params)
      console.log('🥒 UTM params captured:', params)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Capture latest UTM params at submission time
      const currentUTMs = getUTMParams()
      
      const { error } = await supabase
        .from('waitlist')
        .insert([{
          email,
          created_at: new Date().toISOString(),
          positioning_angle: positioningAngle || 'unknown',
          // UTM Parameters for analytics
          utm_source: currentUTMs.utm_source || null,
          utm_medium: currentUTMs.utm_medium || null,
          utm_campaign: currentUTMs.utm_campaign || null,
          utm_content: currentUTMs.utm_content || null,
          utm_term: currentUTMs.utm_term || null,
          // Track if this came from exit intent
          exit_intent_triggered: exitIntentMode
        }])

      if (error) {
        setError("Something went wrong. Please try again.")
        console.error('Supabase error:', error)
      } else {
        // Track signup event with positioning angle and UTMs
        try {
          // PostHog tracking (if available)
          if (typeof window !== 'undefined' && (window as any).posthog) {
            (window as any).posthog.capture('waitlist_signup', {
              email: email,
              positioning_angle: positioningAngle || 'unknown',
              exit_intent: exitIntentMode,
              ...currentUTMs,
              timestamp: new Date().toISOString()
            })
          }

          // LocalStorage fallback with enhanced data
          const signupEvents = JSON.parse(localStorage.getItem("ordersync_signup_events") || "[]")
          signupEvents.push({
            email,
            positioning_angle: positioningAngle || 'unknown',
            exit_intent: exitIntentMode,
            ...currentUTMs,
            timestamp: new Date().toISOString()
          })
          localStorage.setItem("ordersync_signup_events", JSON.stringify(signupEvents))
          
          console.log('🥒 Lead captured with UTMs:', currentUTMs)
        } catch (trackingError) {
          console.warn('Analytics tracking failed:', trackingError)
        }

        setSubmitted(true)
      }
    } catch (err) {
      setError("Network error. Please check your connection.")
      console.error('Network error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Dynamic headline based on mode
  const getHeadline = () => {
    if (exitIntentMode) {
      return "Wait! Get Early Access Bonus"
    }
    return "Request Your Invite"
  }

  const getSubheadline = () => {
    if (exitIntentMode) {
      return "Before you go, claim your early access bonus. Limited spots available."
    }
    return "Quality-focused onboarding"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in p-6">
        {submitted ? (
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {exitIntentMode ? "Bonus Unlocked!" : "Invite Request Received!"}
            </h3>
            <p className="text-slate-600 mb-6">
              Thanks for your interest! We'll review your request and send an invite to <strong>{email}</strong> as soon as a spot opens up.
              {exitIntentMode && " Keep an eye out for your early access bonus details!"}
            </p>
            <button onClick={onClose} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
              Got it!
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 -mx-6 -mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">OS</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {getHeadline()}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {getSubheadline()}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">{exitIntentMode ? "🎁" : "🎯"}</span>
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">
                  {exitIntentMode ? "Don't Miss Out!" : "Quality-Focused Onboarding"}
                </h4>
                <p className="text-sm text-slate-600">
                  {exitIntentMode 
                    ? "Join our exclusive early access group and get priority support + bonus features."
                    : "We're onboarding sellers in small groups to ensure quality support."
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error ? "border-red-300 focus:ring-red-500" : "border-slate-200"
                      }`}
                  />
                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 8-8" />
                      </svg>
                      Joining...
                    </>
                  ) : (
                    exitIntentMode ? "Claim My Early Access" : "Request Invite"
                  )}
                </button>
              </form>

              <p className="mt-4 text-xs text-slate-500 text-center">
                No spam. We'll only email you when spots open up.
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
