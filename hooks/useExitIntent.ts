/**
 * useExitIntent Hook
 * Detects when user's mouse leaves viewport toward the top
 * Triggers callback once per session (unless reset)
 */

import { useEffect, useRef, useCallback } from 'react'

interface UseExitIntentOptions {
  threshold?: number // Distance from top to trigger (default: 10px)
  cooldown?: number // Milliseconds before allowing re-trigger (default: 30000ms = 30s)
  enabled?: boolean // Whether the hook is active (default: true)
}

interface UseExitIntentReturn {
  reset: () => void // Call to allow re-triggering
}

export function useExitIntent(
  onExitIntent: () => void,
  options: UseExitIntentOptions = {}
): UseExitIntentReturn {
  const { 
    threshold = 10, 
    cooldown = 30000, // 30 seconds default
    enabled = true 
  } = options

  const hasTriggered = useRef(false)
  const cooldownTimer = useRef<number | null>(null)

  const reset = useCallback(() => {
    hasTriggered.current = false
    if (cooldownTimer.current) {
      window.clearTimeout(cooldownTimer.current)
      cooldownTimer.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Only track on desktop (mouse events don't apply to mobile)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    
    if (isMobile) return

    const handleMouseLeave = (e: MouseEvent) => {
      // Check if mouse is leaving toward the top of the viewport
      if (e.clientY <= threshold && !hasTriggered.current) {
        hasTriggered.current = true
        onExitIntent()

        // Set cooldown timer to allow re-triggering after delay
        if (cooldown > 0) {
          cooldownTimer.current = window.setTimeout(() => {
            hasTriggered.current = false
          }, cooldown)
        }
      }
    }

    // Also detect when mouse leaves the document (alternative trigger)
    const handleMouseOut = (e: MouseEvent) => {
      // @ts-ignore - toElement is deprecated but widely supported
      const toElement = e.relatedTarget || e.toElement
      if (!toElement && e.clientY <= threshold && !hasTriggered.current) {
        hasTriggered.current = true
        onExitIntent()

        if (cooldown > 0) {
          cooldownTimer.current = window.setTimeout(() => {
            hasTriggered.current = false
          }, cooldown)
        }
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseout', handleMouseOut)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseout', handleMouseOut)
      if (cooldownTimer.current) {
        window.clearTimeout(cooldownTimer.current)
      }
    }
  }, [enabled, threshold, cooldown, onExitIntent])

  return { reset }
}

export default useExitIntent
