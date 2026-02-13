/**
 * Order Sync Agent - Popup UI (Facebook Aesthetic)
 * Fast, contextual UI with Light/Dark mode support
 */

import { useEffect, useState } from "react"
import { ThemeProvider } from "./contexts/ThemeContext"
import { LeftSidebar } from "./components/LeftSidebar"
import { RightSidebar } from "./components/RightSidebar"
import type { AnalysisResult } from "./supabase/functions/_shared/types"
import "./styles/facebook-theme.css"

// Get Supabase URL from environment or use placeholder
const SUPABASE_URL = process.env.PLASMO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const API_URL = `${SUPABASE_URL}/functions/v1`

interface GhostMessage {
  text: string
  isSeller: boolean
  timestamp: number
}

function PopupContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    analyzeConversation()
  }, [])

  const analyzeConversation = async () => {
    try {
      // 1. Get Ghost-Reader data from content script
      const data = await chrome.storage.session.get(["lastConversation"])

      if (!data.lastConversation || data.lastConversation.length === 0) {
        setError("No conversation detected. Open a Messenger chat first.")
        setLoading(false)
        return
      }

      const messages: GhostMessage[] = data.lastConversation

      // 2. Call analyze-conversation Edge Function
      const response = await fetch(`${API_URL}/analyze-conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""}`
        },
        body: JSON.stringify({
          messages: messages,
          shopify_products: [] // TODO: Fetch from Supabase catalog
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const result: AnalysisResult = await response.json()
      setAnalysisResult(result)

      // ANTIGRAVITY TUNING: Optimistic UI Protocol
      if (result.intent_detected && result.confidence > 0.8 && result.variant_id) {
        await generateCheckoutLink(result)
      }
    } catch (err: any) {
      console.error("Analysis error:", err)
      setError(err.message || "Failed to analyze conversation")
    } finally {
      setLoading(false)
    }
  }

  const generateCheckoutLink = async (result: AnalysisResult) => {
    if (!result?.variant_id) return

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""}`
        },
        body: JSON.stringify({
          variant_id: result.variant_id,
          quantity: result.quantity || 1
        })
      })

      if (!response.ok) {
        throw new Error(`Checkout creation failed: ${response.status}`)
      }

      const checkoutResult = await response.json()

      if (checkoutResult.checkout_url) {
        await navigator.clipboard.writeText(checkoutResult.checkout_url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }

      setCheckoutUrl(checkoutResult.checkout_url)
    } catch (err: any) {
      console.error("Checkout error:", err)
      setError(err.message || "Failed to create checkout")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (checkoutUrl) {
      await navigator.clipboard.writeText(checkoutUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={styles.pageContainer}>
      {/* Left Sidebar - Navigation */}
      <LeftSidebar activeItem="Home" />

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {loading ? (
          <div style={styles.centeredCard}>
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Analyzing conversation...</p>
            </div>
          </div>
        ) : error ? (
          <div style={styles.centeredCard}>
            <div style={styles.errorContainer}>
              <span style={styles.errorIcon}>⚠️</span>
              <p style={styles.errorText}>{error}</p>
              <button onClick={() => analyzeConversation()} style={styles.secondaryButton}>
                Try Again
              </button>
            </div>
          </div>
        ) : checkoutUrl ? (
          <div style={styles.centeredCard}>
            <div style={styles.successContainer}>
              <div style={styles.successIcon}>✓</div>
              <h3 style={styles.successTitle}>Checkout Ready!</h3>
              <p style={styles.successSubtitle}>Link copied to clipboard</p>
              <div style={styles.urlCard}>
                <input
                  type="text"
                  value={checkoutUrl}
                  readOnly
                  style={styles.urlInput}
                />
                <button onClick={handleCopy} style={styles.primaryButton}>
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          </div>
        ) : analysisResult?.intent_detected ? (
          <div style={styles.centeredCard}>
            <div style={styles.suggestionCard}>
              <div style={styles.badge}>Purchase Intent Detected</div>
              <h2 style={styles.productTitle}>{analysisResult.product_title || "Product Match"}</h2>
              <div style={styles.productDetails}>
                <span style={styles.detailItem}>{analysisResult.variant_title || "Default Variant"}</span>
                <span style={styles.detailDivider}>•</span>
                <span style={styles.detailItem}>Qty: {analysisResult.quantity || 1}</span>
              </div>
              {analysisResult.trigger_message && (
                <div style={styles.contextQuote}>
                  <p style={styles.quoteLabel}>Buyer said:</p>
                  <p style={styles.quoteText}>"{analysisResult.trigger_message}"</p>
                </div>
              )}
              <div style={styles.confidenceBar}>
                <div
                  style={{
                    ...styles.confidenceFill,
                    width: `${(analysisResult.confidence || 0) * 100}%`,
                    background: (analysisResult.confidence || 0) > 0.8 ? "#00C851" : (analysisResult.confidence || 0) > 0.5 ? "#FF9800" : "#FF4444"
                  }}
                />
                <span style={styles.confidenceLabel}>{Math.round((analysisResult.confidence || 0) * 100)}% confidence</span>
              </div>
              <button
                onClick={() => generateCheckoutLink(analysisResult)}
                style={styles.primaryButton}
                disabled={!analysisResult.variant_id}
              >
                Generate Checkout Link
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.centeredCard}>
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>💬</span>
              <h3 style={styles.emptyTitle}>No Purchase Intent Found</h3>
              <p style={styles.emptyText}>Keep chatting with the buyer and try again.</p>
              <button onClick={() => analyzeConversation()} style={styles.secondaryButton}>
                Refresh Analysis
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar - Context & Theme Toggle */}
      <RightSidebar
        aiScore={{
          score: analysisResult?.confidence ? Math.round(analysisResult.confidence * 100) : 0,
          label: analysisResult?.intent_detected ? (analysisResult.confidence > 0.8 ? "Hot Lead" : "Warm Lead") : "No Intent",
          lastUpdated: "Just now"
        }}
        slaAlerts={[
          { id: "1", type: "urgent", message: "Response time: 3m 45s (SLA: 5min)", timestamp: "Active now" }
        ]}
      />
    </div>
  )
}

export default function Popup() {
  return (
    <ThemeProvider>
      <PopupContent />
    </ThemeProvider>
  )
}

// Facebook Aesthetic Styles
const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "var(--fb-bg-primary)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  mainContent: {
    marginLeft: "280px",
    marginRight: "320px",
    flex: 1,
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  centeredCard: {
    background: "var(--fb-bg-secondary)",
    borderRadius: "8px",
    boxShadow: "var(--card-shadow)",
    padding: "32px",
    maxWidth: "480px",
    width: "100%",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid var(--fb-bg-tertiary)",
    borderTop: "4px solid var(--fb-blue)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "var(--fb-text-secondary)",
    fontSize: "14px",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "20px",
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  errorText: {
    color: "var(--fb-text-secondary)",
    fontSize: "14px",
    marginBottom: "20px",
    lineHeight: 1.5,
  },
  secondaryButton: {
    padding: "10px 24px",
    background: "var(--fb-bg-tertiary)",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--fb-text-primary)",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  successContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  successIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "var(--fb-green)",
    color: "white",
    fontSize: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  successTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
    margin: "0 0 4px 0",
  },
  successSubtitle: {
    fontSize: "14px",
    color: "var(--fb-text-secondary)",
    marginBottom: "24px",
  },
  urlCard: {
    width: "100%",
    background: "var(--fb-bg-tertiary)",
    borderRadius: "8px",
    padding: "16px",
  },
  urlInput: {
    width: "100%",
    padding: "12px",
    border: "1px solid var(--fb-border)",
    borderRadius: "6px",
    fontSize: "13px",
    color: "var(--fb-text-secondary)",
    marginBottom: "12px",
    background: "var(--fb-bg-secondary)",
    wordBreak: "break-all",
  },
  primaryButton: {
    width: "100%",
    padding: "12px 16px",
    background: "var(--fb-blue)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  suggestionCard: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  badge: {
    display: "inline-flex",
    alignSelf: "flex-start",
    padding: "4px 12px",
    background: "var(--fb-blue)",
    color: "white",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  productTitle: {
    fontSize: "22px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
    margin: 0,
    lineHeight: 1.3,
  },
  productDetails: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  detailItem: {
    fontSize: "14px",
    color: "var(--fb-text-secondary)",
  },
  detailDivider: {
    color: "var(--fb-text-tertiary)",
  },
  contextQuote: {
    background: "var(--fb-bg-tertiary)",
    borderRadius: "8px",
    padding: "16px",
  },
  quoteLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--fb-text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 8px 0",
  },
  quoteText: {
    fontSize: "14px",
    color: "var(--fb-text-primary)",
    fontStyle: "italic",
    margin: 0,
    lineHeight: 1.5,
  },
  confidenceBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
  },
  confidenceFill: {
    height: "6px",
    borderRadius: "3px",
    flex: 1,
    transition: "width 0.3s ease",
  },
  confidenceLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--fb-text-secondary)",
    whiteSpace: "nowrap",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--fb-text-primary)",
    margin: "0 0 8px 0",
  },
  emptyText: {
    fontSize: "14px",
    color: "var(--fb-text-secondary)",
    margin: "0 0 20px 0",
  },
}
