/**
 * Simulation Widget - Regex-based Purchase Intent Detection
 * Reusable component for Live Preview functionality
 */

import React, { useState, useCallback } from "react"

export interface SimulationResult {
  intent_detected: boolean
  confidence: number
  product_title: string | null
  variant_title: string | null
  trigger_message: string | null
}

export interface SimulationPattern {
  regex: RegExp
  confidence: number
  product_title: string
  variant_title: string
}

export const SIMULATION_PATTERNS: SimulationPattern[] = [
  {
    regex: /(?:i want|buy|order|purchase|get me)\s+(.+?)(?:\s+please|\s+now|\s+today)?[\s.!]*$/i,
    confidence: 0.95,
    product_title: "Premium Product",
    variant_title: "Default",
  },
  {
    regex: /(?:how much|price|cost|do you have)\s+(.+?)\?*$/i,
    confidence: 0.85,
    product_title: "Product Inquiry",
    variant_title: "General",
  },
  {
    regex: /(?:is this available|still in stock|can i get)\s+(.+?)\?*$/i,
    confidence: 0.80,
    product_title: "Availability Check",
    variant_title: "Stock Check",
  },
  {
    regex: /(?:shipping|delivery|how long)\s+(?:to|does)\s+(.+?)\?*$/i,
    confidence: 0.70,
    product_title: "Shipping Question",
    variant_title: "Logistics",
  },
  {
    regex: /(?:interested|want more info|tell me)\s+(.+?)\?*$/i,
    confidence: 0.75,
    product_title: "Interest Expressed",
    variant_title: "Info Request",
  },
  {
    regex: /(?:where|when|can i)\s+(?:buy|purchase|order|get)\s+(.+?)\?*$/i,
    confidence: 0.82,
    product_title: "Purchase Location",
    variant_title: "Availability",
  },
]

export function simulateExtraction(input: string): SimulationResult {
  if (!input || input.trim().length < 5) {
    return {
      intent_detected: false,
      confidence: 0,
      product_title: null,
      variant_title: null,
      trigger_message: null,
    }
  }

  const normalizedInput = input.toLowerCase().trim()

  for (const pattern of SIMULATION_PATTERNS) {
    const match = normalizedInput.match(pattern.regex)
    if (match && match[1]) {
      return {
        intent_detected: true,
        confidence: pattern.confidence,
        product_title: pattern.product_title,
        variant_title: pattern.variant_title,
        trigger_message: input.trim(),
      }
    }
  }

  return {
    intent_detected: false,
    confidence: 0,
    product_title: null,
    variant_title: null,
    trigger_message: null,
  }
}

interface SimulationWidgetProps {
  placeholder?: string
  onGenerateCheckout?: (result: SimulationResult) => void
  showGenerateButton?: boolean
}

export function SimulationWidget({
  placeholder = "Type a customer message...",
  onGenerateCheckout,
  showGenerateButton = true,
}: SimulationWidgetProps) {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyze = useCallback((text: string) => {
    if (text.length < 5) {
      setResult(null)
      return
    }

    setIsAnalyzing(true)
    const timer = setTimeout(() => {
      const analysis = simulateExtraction(text)
      setResult(analysis)
      setIsAnalyzing(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    analyze(value)
  }

  const handleGenerateCheckout = () => {
    if (result && onGenerateCheckout) {
      onGenerateCheckout(result)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "var(--fb-green)"
    if (confidence >= 0.6) return "var(--fb-orange)"
    return "var(--fb-red)"
  }

  return (
    <div style={styles.widget}>
      <div style={styles.header}>
        <span style={styles.title}>Live Preview</span>
        <span style={styles.badge}>AI-Powered</span>
      </div>

      <div style={styles.content}>
        <div style={styles.inputArea}>
          <label style={styles.label}>Customer says:</label>
          <textarea
            style={styles.input}
            placeholder={placeholder}
            value={input}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        <div style={styles.resultArea}>
          {isAnalyzing ? (
            <div style={styles.analyzingState}>
              <div style={styles.spinner} />
              <span>Analyzing...</span>
            </div>
          ) : result ? (
            <div style={styles.resultContainer}>
              <div style={styles.resultHeader}>
                <span style={styles.resultIcon}>
                  {result.intent_detected ? "✓" : "○"}
                </span>
                <span
                  style={{
                    ...styles.resultLabel,
                    color: result.intent_detected
                      ? "var(--fb-green)"
                      : "var(--fb-text-tertiary)",
                  }}
                >
                  {result.intent_detected
                    ? "Purchase Intent Detected"
                    : "No intent detected"}
                </span>
              </div>

              {result.intent_detected && (
                <>
                  <div style={styles.confidenceSection}>
                    <div style={styles.confidenceLabel}>
                      Confidence: {Math.round(result.confidence * 100)}%
                    </div>
                    <div style={styles.confidenceTrack}>
                      <div
                        style={{
                          ...styles.confidenceFill,
                          width: `${result.confidence * 100}%`,
                          background: getConfidenceColor(result.confidence),
                        }}
                      />
                    </div>
                  </div>

                  <div style={styles.matchSection}>
                    <div style={styles.matchRow}>
                      <span style={styles.matchLabel}>Product:</span>
                      <span style={styles.matchValue}>{result.product_title}</span>
                    </div>
                    <div style={styles.matchRow}>
                      <span style={styles.matchLabel}>Variant:</span>
                      <span style={styles.matchValue}>{result.variant_title}</span>
                    </div>
                    {result.trigger_message && (
                      <div style={styles.matchRow}>
                        <span style={styles.matchLabel}>Message:</span>
                        <span style={styles.matchQuote}>"{result.trigger_message}"</span>
                      </div>
                    )}
                  </div>

                  {showGenerateButton && (
                    <button
                      style={styles.generateButton}
                      onClick={handleGenerateCheckout}
                    >
                      Generate Checkout Link
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div style={styles.placeholderState}>
              <span style={styles.placeholderIcon}>💬</span>
              <span style={styles.placeholderText}>
                Start typing to see intent detection in action
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.footer}>
        Try: "I want to buy this", "How much?", "Is this available?"
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  widget: {
    background: "var(--fb-bg-secondary)",
    borderRadius: "12px",
    boxShadow: "var(--card-shadow)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "var(--fb-bg-tertiary)",
    borderBottom: "1px solid var(--fb-border)",
  },
  title: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--fb-text-primary)",
  },
  badge: {
    padding: "2px 8px",
    background: "var(--fb-blue-light)",
    color: "var(--fb-blue)",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: 600,
  },
  content: {
    padding: "16px",
  },
  inputArea: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--fb-text-secondary)",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px",
    background: "var(--fb-bg-tertiary)",
    border: "1px solid var(--fb-border)",
    borderRadius: "8px",
    fontSize: "14px",
    color: "var(--fb-text-primary)",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },
  resultArea: {
    minHeight: "120px",
    background: "var(--fb-bg-primary)",
    borderRadius: "8px",
    padding: "16px",
  },
  analyzingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "var(--fb-text-secondary)",
    height: "100%",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid var(--fb-border)",
    borderTop: "2px solid var(--fb-blue)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  resultContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  resultIcon: {
    fontSize: "18px",
  },
  resultLabel: {
    fontSize: "14px",
    fontWeight: 600,
  },
  confidenceSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  confidenceLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--fb-text-secondary)",
  },
  confidenceTrack: {
    height: "6px",
    background: "var(--fb-bg-tertiary)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  matchSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "12px",
    background: "var(--fb-bg-secondary)",
    borderRadius: "6px",
  },
  matchRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  },
  matchLabel: {
    fontSize: "12px",
    color: "var(--fb-text-tertiary)",
    minWidth: "60px",
  },
  matchValue: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--fb-text-primary)",
  },
  matchQuote: {
    fontSize: "13px",
    color: "var(--fb-text-secondary)",
    fontStyle: "italic",
  },
  generateButton: {
    padding: "10px 16px",
    background: "var(--fb-blue)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  placeholderState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "var(--fb-text-tertiary)",
    height: "100%",
  },
  placeholderIcon: {
    fontSize: "24px",
  },
  placeholderText: {
    fontSize: "13px",
    textAlign: "center",
  },
  footer: {
    padding: "10px 16px",
    background: "var(--fb-bg-tertiary)",
    borderTop: "1px solid var(--fb-border)",
    textAlign: "center",
    fontSize: "12px",
    color: "var(--fb-text-tertiary)",
  },
}
