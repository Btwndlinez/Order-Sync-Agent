/**
 * Tracking Provider - Privacy-First Analytics
 * Supports Plausible (website) and PostHog (extension) with privacy guardrails
 */

import React, { createContext, useContext, useEffect, useCallback } from "react"

interface TrackingContext {
  trackEvent: (name: string, properties?: Record<string, any>) => void
  trackGoal: (goalName: string, revenue?: number) => void
  identifyUser: (userId: string, traits?: Record<string, any>) => void
}

const TrackingContext = createContext<TrackingContext | null>(null)

interface TrackingProviderProps {
  children: React.ReactNode
  plausibleDomain?: string
  posthogApiKey?: string
  posthogHost?: string
}

interface PlausibleWindow extends Window {
  plausible?: (event: string, options?: { callback?: () => void; props?: Record<string, string | number> }) => void
}

declare const window: PlausibleWindow

export function TrackingProvider({
  children,
  plausibleDomain = "ordersync.io",
  posthogApiKey,
  posthogHost = "https://app.posthog.com",
}: TrackingProviderProps) {
  const initPlausible = useCallback(() => {
    if (typeof window === "undefined") return

    const script = document.createElement("script")
    script.defer = true
    script.dataset.domain = plausibleDomain
    script.src = "https://plausible.io/js/script.js"
    script.crossOrigin = "anonymous"

    document.head.appendChild(script)

    window.plausible = window.plausible || function () {
      (window.plausible as any).q = (window.plausible as any).q || []
      ;(window.plausible as any).q.push(arguments)
    }
  }, [plausibleDomain])

  const initPostHog = useCallback(() => {
    if (!posthogApiKey || typeof window === "undefined") return

    ;(window as any).posthog = (window as any).posthog || []
    ;(window as any).posthog.init(posthogApiKey, {
      api_host: posthogHost,
      persistence: "localStorage",
      autocapture: false,
      capture_pageview: true,
    })
  }, [posthogApiKey, posthogHost])

  useEffect(() => {
    initPlausible()
    initPostHog()
  }, [initPlausible, initPostHog])

  const trackEvent = useCallback((name: string, properties?: Record<string, any>) => {
    if (typeof window !== "undefined") {
      if ((window as any).posthog) {
        ;(window as any).posthog.capture(name, sanitizeProperties(properties))
      }
      if (window.plausible) {
        window.plausible(name, { props: sanitizeProperties(properties) })
      }
    }
  }, [])

  const trackGoal = useCallback((goalName: string, revenue?: number) => {
    if (typeof window !== "undefined") {
      if (window.plausible) {
        window.plausible(goalName, {
          props: revenue ? { revenue } : undefined,
        })
      }
    }
  }, [])

  const identifyUser = useCallback((userId: string, traits?: Record<string, any>) => {
    if (typeof window !== "undefined" && (window as any).posthog) {
      ;(window as any).posthog.identify(userId, sanitizeProperties(traits))
    }
  }, [])

  return (
    <TrackingContext.Provider value={{ trackEvent, trackGoal, identifyUser }}>
      {children}
    </TrackingContext.Provider>
  )
}

function sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
  if (!properties) return undefined

  const blockedKeys = [
    "text",
    "message",
    "content",
    "email",
    "name",
    "phone",
    "address",
    "buyer",
    "customer",
    "conversation",
    "chat",
  ]

  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(properties)) {
    const lowerKey = key.toLowerCase()
    const isBlocked = blockedKeys.some((blocked) => lowerKey.includes(blocked))

    if (!isBlocked && value !== undefined && value !== null) {
      if (typeof value === "object") {
        sanitized[key] = sanitizeProperties(value)
      } else {
        sanitized[key] = value
      }
    }
  }

  return sanitized
}

export function useTracking() {
  const context = useContext(TrackingContext)
  if (!context) {
    throw new Error("useTracking must be used within a TrackingProvider")
  }
  return context
}

export const PLausible_GOALS = {
  HERO_CTA_CLICK: "Hero CTA Click",
  PRICING_SELECTION: "Pricing Selection",
  STRIPE_SUCCESS: "Stripe Success",
  WATCH_DEMO_CLICK: "Watch Demo Click",
  LIVE_DEMO_TRY: "Live Demo Try",
} as const

export const PostHog_EVENTS = {
  LINK_GENERATED: "link_generated",
  LIMIT_REACHED: "limit_reached",
  UPGRADE_BUTTON_CLICKED: "upgrade_button_clicked",
  CHECKOUT_CREATED: "checkout_created",
  ANALYZER_RUN: "analyzer_run",
  EXTENSION_INSTALLED: "extension_installed",
} as const
