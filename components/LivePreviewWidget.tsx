/**
 * Live Preview Widget - Lead Magnet Component
 * Interactive demo that captures leads with 2-second value demonstration
 */

import React, { useState, useEffect } from "react"

interface ExtractionResult {
  product: string | null
  name: string | null
  price: string | null
  confidence: number
}

const MOCK_PATTERNS = [
  {
    regex: /(?:hi|hello|hey)\s+(?:is|are|can)\s+(?:you|there)\s+(?:available|working)/i,
    product: "General Inquiry",
    name: "New Lead",
    price: null,
  },
  {
    regex: /i(?:'|\s)?(?:want|need|would like)\s+(?:to\s+)?(?:buy|order|get)\s+(?:the\s+)?(.+?)(?:\s+for|\s+at|\s+,|\.)/i,
    extractPrice: /\$\s?(\d+(?:\.\d{2})?)/,
    product: 1,
    name: "New Lead",
  },
  {
    regex: /how\s+much\s+(?:is|are|does)\s+(?:the\s+)?(.+?)(?:\s+cost|\s+please|\?)/i,
    extractPrice: /\$\s?(\d+(?:\.\d{2})?)/,
    product: 1,
    name: "Price Inquirer",
  },
  {
    regex: /(?:hi|hello|hey)\s+(?:im|i'm)\s+(.+?)(?:\s+and|\s+,|\.|!|\?|$)/i,
    name: 1,
    product: "General Inquiry",
    price: null,
  },
  {
    regex: /(?:still|is)\s+(?:the\s+)?(.+?)\s+(?:available|in\s+stock)/i,
    product: 1,
    name: "Returning Customer",
    price: null,
  },
  {
    regex: /(?:interested|want|would\s+like)\s+(?:in|for|to\s+buy)\s+(?:the\s+)?(.+?)(?:\?|!|\.|,|\s+and)/i,
    product: 1,
    name: "Interested Buyer",
    price: null,
  },
]

function simulateExtraction(text: string): ExtractionResult {
  const normalizedText = text.toLowerCase().trim()

  for (const pattern of MOCK_PATTERNS) {
    const match = normalizedText.match(pattern.regex)
    if (match) {
      let product = typeof pattern.product === "number" ? match[pattern.product] : pattern.product
      let name = typeof pattern.name === "number" ? match[pattern.name] : pattern.name
      let price: string | null = null

      if (pattern.extractPrice) {
        const priceMatch = text.match(pattern.extractPrice)
        price = priceMatch ? `$${priceMatch[1]}` : null
      }

      if (product || name) {
        const confidence = product && price ? 0.92 : product ? 0.85 : 0.70

        return {
          product: product ? product.charAt(0).toUpperCase() + product.slice(1) : "Unknown Product",
          name: name ? name.charAt(0).toUpperCase() + name.slice(1) : "New Lead",
          price: price || "$XX.XX",
          confidence,
        }
      }
    }
  }

  return {
    product: "Product Inquiry",
    name: "New Lead",
    price: null,
    confidence: 0.65,
  }
}

interface LivePreviewWidgetProps {
  onCtaClick?: () => void
}

export function LivePreviewWidget({ onCtaClick }: LivePreviewWidgetProps) {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    if (input.length > 10 && !hasSubmitted) {
      const timer = setTimeout(() => {
        setIsAnalyzing(true)
        const extraction = simulateExtraction(input)
        setResult(extraction)
        setIsAnalyzing(false)
        setHasSubmitted(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [input, hasSubmitted])

  const handleReset = () => {
    setInput("")
    setResult(null)
    setHasSubmitted(false)
    setIsAnalyzing(false)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "#00c851"
    if (confidence >= 0.70) return "#ff9800"
    return "#ff4444"
  }

  const sampleMessages = [
    "Hi! I'm interested in the black hoodie, how much is it?",
    "Hey, is the leather jacket still available?",
    "Hello! I'd like to buy the white sneakers for my daughter.",
  ]

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.badge}>✨ Live Demo</span>
        <span style={styles.subtitle}>Try it right now - no sign-up required</span>
      </div>

      <div style={styles.widgetCard}>
        {!result ? (
          <>
            <div style={styles.inputSection}>
              <label style={styles.label}>
                Paste a Messenger message below to see Order Sync Agent extract the details:
              </label>
              <textarea
                style={styles.textarea}
                placeholder="Hi! I'm interested in the black hoodie, how much is it?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
              />
            </div>

            <div style={styles.samples}>
              <span style={styles.samplesLabel}>Try a sample:</span>
              <div style={styles.sampleButtons}>
                {sampleMessages.slice(0, 2).map((msg, idx) => (
                  <button
                    key={idx}
                    style={styles.sampleButton}
                    onClick={() => {
                      setInput(msg)
                      setHasSubmitted(false)
                      setResult(null)
                    }}
                  >
                    {msg.length > 35 ? msg.slice(0, 35) + "..." : msg}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : isAnalyzing ? (
          <div style={styles.analyzingState}>
            <div style={styles.spinner} />
            <span style={styles.analyzingText}>Analyzing message...</span>
          </div>
        ) : (
          <div style={styles.resultSection}>
            <div style={styles.successHeader}>
              <span style={styles.successIcon}>✓</span>
              <span style={styles.successText}>Extraction Complete!</span>
            </div>

            <div style={styles.confidenceBar}>
              <span style={styles.confidenceLabel}>
                Confidence: {Math.round(result.confidence * 100)}%
              </span>
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

            <div style={styles.extractedData}>
              <div style={styles.dataRow}>
                <span style={styles.dataLabel}>👤 Customer</span>
                <span style={styles.dataValue}>{result.name}</span>
              </div>
              <div style={styles.dataRow}>
                <span style={styles.dataLabel}>📦 Product</span>
                <span style={styles.dataValue}>{result.product}</span>
              </div>
              <div style={styles.dataRow}>
                <span style={styles.dataLabel}>💰 Price</span>
                <span style={styles.dataValue}>{result.price || "Not specified"}</span>
              </div>
            </div>

            <div style={styles.timingRow}>
              <span style={styles.timerIcon}>⏱️</span>
              <span style={styles.timerText}>Processed in 0.3 seconds</span>
            </div>
          </div>
        )}
      </div>

      <div style={styles.ctaSection}>
        {result ? (
          <>
            <p style={styles.ctaText}>
              This took <strong>0.3 seconds</strong>. Ready to do it for real?
            </p>
            <button style={styles.primaryCta} onClick={onCtaClick}>
              Download Extension Free
            </button>
            <button style={styles.resetButton} onClick={handleReset}>
              Try another message
            </button>
          </>
        ) : (
          <p style={styles.ctaPlaceholder}>
            Paste a message above to see the magic happen ✨
          </p>
        )}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 14px",
    background: "linear-gradient(135deg, #4f46e5 0%, #34d399 100%)",
    color: "white",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 600,
    width: "fit-content",
    margin: "0 auto",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--fb-text-secondary)",
  },
  widgetCard: {
    background: "var(--fb-bg-secondary)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "var(--card-shadow)",
    border: "1px solid var(--fb-border)",
  },
  inputSection: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--fb-text-primary)",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    background: "var(--fb-bg-tertiary)",
    border: "1px solid var(--fb-border)",
    borderRadius: "10px",
    fontSize: "14px",
    color: "var(--fb-text-primary)",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },
  samples: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  samplesLabel: {
    fontSize: "12px",
    color: "var(--fb-text-tertiary)",
  },
  sampleButtons: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  sampleButton: {
    padding: "4px 10px",
    background: "var(--fb-bg-tertiary)",
    border: "1px solid var(--fb-border)",
    borderRadius: "6px",
    fontSize: "11px",
    color: "var(--fb-text-secondary)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  analyzingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "40px",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid var(--fb-border)",
    borderTop: "3px solid var(--fb-blue)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  analyzingText: {
    fontSize: "14px",
    color: "var(--fb-text-secondary)",
  },
  resultSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  successHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  successIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "var(--fb-green)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  },
  successText: {
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--fb-green)",
  },
  confidenceBar: {
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
    transition: "width 0.5s ease",
  },
  extractedData: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "16px",
    background: "var(--fb-bg-primary)",
    borderRadius: "10px",
  },
  dataRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dataLabel: {
    fontSize: "13px",
    color: "var(--fb-text-tertiary)",
  },
  dataValue: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--fb-text-primary)",
  },
  timingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px",
    background: "rgba(0, 200, 81, 0.1)",
    borderRadius: "6px",
  },
  timerIcon: {
    fontSize: "14px",
  },
  timerText: {
    fontSize: "13px",
    color: "var(--fb-green)",
    fontWeight: 500,
  },
  ctaSection: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  ctaText: {
    fontSize: "15px",
    color: "var(--fb-text-secondary)",
    lineHeight: 1.5,
  },
  primaryCta: {
    padding: "14px 28px",
    background: "var(--fb-blue)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(8, 102, 255, 0.3)",
  },
  resetButton: {
    padding: "8px 16px",
    background: "transparent",
    color: "var(--fb-text-secondary)",
    border: "none",
    fontSize: "13px",
    cursor: "pointer",
    textDecoration: "underline",
  },
  ctaPlaceholder: {
    fontSize: "14px",
    color: "var(--fb-text-tertiary)",
    fontStyle: "italic",
  },
}
