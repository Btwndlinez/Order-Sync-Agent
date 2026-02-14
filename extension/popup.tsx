import { useEffect, useState } from "react"
import { ThemeProvider } from "../contexts/ThemeContext"
import { ThemeToggle } from "../components/ThemeToggle"
import type { AnalysisResult } from "../supabase/functions/_shared/types"
import "../styles/facebook-theme.css"

const SUPABASE_URL = process.env.PLASMO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const API_URL = `${SUPABASE_URL}/functions/v1`
const SELLER_ID = "default_seller"

interface GhostMessage {
  text: string
  isSeller: boolean
  timestamp: number
}

interface UsageStatus {
  plan: 'starter' | 'pro' | 'scale'
  links_used: number
  links_limit: number
  links_remaining: number
  can_create_link: boolean
}

function SuccessMilestoneModal({ 
  isOpen, 
  onClose, 
  onUpgrade
}: {
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
}) {
  if (!isOpen) return null

  const handleUpgradeClick = async () => {
    try {
      onUpgrade()
      onClose()
    } catch (error) {
      console.error("Upgrade failed:", error)
    }
  }

  return (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.icon}>🏆</div>
        <h2 style={modalStyles.title}>20 Sales Links Sent! 🏆</h2>
        <p style={modalStyles.subtitle}>
          You're crushing it. Upgrade to Pro to keep the momentum going.
        </p>
        
        <div style={modalStyles.tierComparison}>
          <div style={modalStyles.tierCard}>
            <div style={modalStyles.tierName}>Starter</div>
            <div style={modalStyles.tierPrice}>$19/mo</div>
            <div style={modalStyles.tierLimit}>20 links</div>
            <div style={modalStyles.currentPlan}>Current</div>
          </div>
          
          <div style={{...modalStyles.tierCard, ...modalStyles.tierCardRecommended}}>
            <div style={modalStyles.recommendedBadge}>RECOMMENDED</div>
            <div style={modalStyles.tierName}>Pro</div>
            <div style={modalStyles.tierPrice}>$49/mo</div>
            <div style={modalStyles.tierLimit}>200 links</div>
            <div style={modalStyles.savings}>+$30/mo value</div>
          </div>
          
          <div style={modalStyles.tierCard}>
            <div style={modalStyles.tierName}>Scale</div>
            <div style={modalStyles.tierPrice}>$149/mo</div>
            <div style={modalStyles.tierLimit}>1000 links</div>
          </div>
        </div>

        <button 
          onClick={handleUpgradeClick}
          style={modalStyles.upgradeButton}
        >
          Upgrade to Pro
        </button>
        
        <button 
          onClick={onClose}
          style={modalStyles.closeButton}
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}

function PopupContent() {
  const [loading, setLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    fetchUsageStatus()
    analyzeConversation()
  }, [])

  const fetchUsageStatus = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_usage_status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""}`,
          "apikey": process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""
        },
        body: JSON.stringify({ p_seller_id: SELLER_ID })
      })

      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          setUsage(data[0])
        }
      }
    } catch (err) {
      console.error("Usage fetch error:", err)
    }
  }

  const analyzeConversation = async () => {
    try {
      const data = await chrome.storage.session.get(["lastConversation"])

      if (!data.lastConversation || data.lastConversation.length === 0) {
        setError("No conversation detected. Open a Messenger chat first.")
        setLoading(false)
        return
      }

      const messages: GhostMessage[] = data.lastConversation

      const response = await fetch(`${API_URL}/analyze-conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""}`
        },
        body: JSON.stringify({
          messages: messages,
          seller_id: SELLER_ID,
          shopify_products: []
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const result: AnalysisResult = await response.json()
      setAnalysisResult(result)

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

    setSyncLoading(true)
    try {
      const response = await fetch(`${API_URL}/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""}`
        },
        body: JSON.stringify({
          variant_id: result.variant_id,
          quantity: result.quantity || 1,
          price: result.total_value || 0,
          product_title: result.product_title || "Product",
          seller_id: SELLER_ID
        })
      })

      const checkoutResult = await response.json()

      // Handle 403 - Usage limit reached
      if (response.status === 403) {
        setShowUpgradeModal(true)
        setSyncLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(`Checkout creation failed: ${checkoutResult.error || response.status}`)
      }

      if (checkoutResult.checkout_url) {
        setShowSuccess(true)
        setSyncLoading(false)
        setTimeout(() => {
          setShowSuccess(false)
        }, 2000)
      }

      setUsage(checkoutResult.usage)
    } catch (err: any) {
      console.error("Checkout error:", err)
      setError(err.message || "Failed to create checkout")
    } finally {
      setSyncLoading(false)
    }
  }

  const handleUpgradeToPro = async () => {
    try {
      // Get auth token (assuming user is authenticated via Supabase)
      const { data: { session } } = await chrome.storage.local.get(['supabase_session'])
      
      const response = await fetch(`${API_URL}/create-subscription-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ""}`
        },
        body: JSON.stringify({
          customer_email: session?.user?.email
        })
      })

      const result = await response.json()
      
      if (result.checkout_url) {
        window.open(result.checkout_url, '_blank')
      }
    } catch (error) {
      console.error("Upgrade error:", error)
    }
  }

  const getPlanDisplayName = (plan?: string) => {
    switch (plan) {
      case 'starter': return 'Starter'
      case 'pro': return 'Pro'
      case 'scale': return 'Scale'
      default: return 'Starter'
    }
  }

  const getUsageColor = () => {
    if (!usage) return "#1877f2"
    const percentage = (usage.links_used / usage.links_limit) * 100
    if (percentage >= 90) return "#ff4d4d"
    if (percentage >= 75) return "#ff9800"
    return "#00c851"
  }

  return (
    <div style={styles.popupContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <img 
            src="../assets/sync-logo.png" 
            alt="Order Sync Agent" 
            style={styles.logoImage}
          />
          <span style={styles.logoText}>OrderSync<span style={styles.logoAccent}>Agent</span></span>
        </div>
        <div style={styles.headerActions}>
          <ThemeToggle />
          <div 
            style={{
              ...styles.statusDot, 
              background: syncLoading ? "var(--fb-orange)" : error ? "var(--fb-red)" : "var(--fb-green)"
            }}
          />
        </div>
      </header>

      {/* Usage Progress Bar */}
      {usage && (
        <div style={styles.usageBar}>
          <div style={styles.usageInfo}>
            <span style={styles.planBadge}>{getPlanDisplayName(usage.plan)}</span>
            <span style={styles.usageText}>
              {usage.links_used} / {usage.links_limit} links
            </span>
          </div>
          <div style={styles.progressBarContainer}>
            <div 
              style={{
                ...styles.progressBar,
                width: `${(usage.links_used / usage.links_limit) * 100}%`,
                background: getUsageColor()
              }}
            />
          </div>
          {usage.links_remaining <= 5 && (
            <button 
              onClick={() => setShowUpgradeModal(true)}
              style={styles.upgradeLink}
            >
              ⚠️ {usage.links_remaining} left - Upgrade now
            </button>
          )}
        </div>
      )}

      {/* Main Content */}
      <main style={styles.main}>
        {loading ? (
          <div style={styles.stateContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.stateText}>Analyzing conversation...</p>
          </div>
        ) : error ? (
          <div style={styles.stateContainer}>
            <span style={styles.stateIcon}>⚠️</span>
            <p style={styles.errorMessage}>{error}</p>
            <button onClick={() => analyzeConversation()} style={styles.secondaryButton}>
              Try Again
            </button>
          </div>
        ) : showSuccess ? (
          <div style={styles.stateContainer}>
            <div style={styles.successBadge}>
              <span style={styles.successIcon}>✓</span>
            </div>
            <h3 style={styles.successTitle}>Link Pasted! ✅</h3>
            <p style={styles.stateText}>Checkout link ready in Messenger</p>
          </div>
        ) : analysisResult?.intent_detected ? (
          <div style={styles.intentCard}>
            <div style={styles.badgeRow}>
              <span style={styles.intentBadge}>Purchase Intent</span>
              <span 
                style={{
                  ...styles.confidenceBadge,
                  background: (analysisResult.confidence || 0) > 0.8 ? "rgba(0, 200, 81, 0.1)" : "rgba(255, 152, 0, 0.1)",
                  color: (analysisResult.confidence || 0) > 0.8 ? "var(--fb-green)" : "var(--fb-orange)"
                }}
              >
                {Math.round((analysisResult.confidence || 0) * 100)}% match
              </span>
            </div>
            
            <h2 style={styles.productTitle}>{analysisResult.product_title || "Product Match"}</h2>
            <p style={styles.productVariant}>{analysisResult.variant_title || "Default Variant"}</p>
            
            {analysisResult.trigger_message && (
              <div style={styles.quoteBox}>
                <p style={styles.quoteText}>"{analysisResult.trigger_message}"</p>
              </div>
            )}
            
            <button
              onClick={() => generateCheckoutLink(analysisResult)}
              style={{
                ...styles.primaryButton,
                ...(syncLoading ? styles.buttonLoading : {}),
                ...(showSuccess ? styles.buttonSuccess : {})
              }}
              disabled={!analysisResult.variant_id || !!(usage && !usage.can_create_link)}
            >
              {syncLoading ? (
                <span style={styles.buttonSpinner}></span>
              ) : showSuccess ? (
                "✅ Link Pasted!"
              ) : usage && !usage.can_create_link ? (
                "Limit Reached - Upgrade"
              ) : (
                "Generate Checkout"
              )}
            </button>
          </div>
        ) : (
          <div style={styles.stateContainer}>
            <span style={styles.stateIcon}>💬</span>
            <p style={styles.emptyTitle}>No Purchase Intent</p>
            <p style={styles.emptyText}>Keep chatting with the buyer</p>
            <button onClick={() => analyzeConversation()} style={styles.secondaryButton}>
              Refresh
            </button>
          </div>
        )}
      </main>

      {/* Success Milestone Modal */}
      <SuccessMilestoneModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgradeToPro}
      />

      {/* Footer Stats */}
      <footer style={styles.footer}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>AI Score</span>
          <span 
            style={{
              ...styles.statValue,
              color: (analysisResult?.confidence || 0) > 0.8 ? "var(--fb-green)" : (analysisResult?.confidence || 0) > 0.5 ? "var(--fb-orange)" : "var(--fb-text-secondary)"
            }}
          >
            {analysisResult?.confidence ? Math.round(analysisResult.confidence * 100) : 0}%
          </span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.stat}>
          <span style={styles.statLabel}>Response</span>
          <span style={{...styles.statValue, color: "var(--fb-green)"}}>2m</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.stat}>
          <span style={styles.statLabel}>SLA</span>
          <span style={{...styles.statValue, color: "var(--fb-blue)"}}>OK</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.legalLinks}>
          <button 
            onClick={() => window.open(chrome.runtime.getURL('Legal/PrivacyPolicy.html'), '_blank')}
            style={styles.legalLink}
          >
            Privacy
          </button>
          <button 
            onClick={() => window.open(chrome.runtime.getURL('Legal/TermsOfService.html'), '_blank')}
            style={styles.legalLink}
          >
            Terms
          </button>
        </div>
      </footer>
    </div>
  )
}

export default function ExtensionPopup() {
  return (
    <ThemeProvider>
      <PopupContent />
    </ThemeProvider>
  )
}

// Modal-specific styles
const modalStyles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: "fixed" as any,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "var(--fb-bg-primary)",
    borderRadius: "12px",
    padding: "32px 24px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
    textAlign: "center" as any,
    border: "1px solid var(--fb-border)",
  },
  icon: {
    fontSize: "56px",
    marginBottom: "16px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
    margin: "0 0 12px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "var(--fb-text-secondary)",
    margin: "0 0 24px 0",
    lineHeight: 1.5,
  },
  tierComparison: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    width: "100%",
  },
  tierCard: {
    flex: 1,
    padding: "16px 8px",
    backgroundColor: "var(--fb-bg-secondary)",
    borderRadius: "8px",
    textAlign: "center" as any,
    position: "relative" as any,
    border: "1px solid var(--fb-border)",
  },
  tierCardRecommended: {
    border: "2px solid var(--fb-blue)",
    backgroundColor: "rgba(24, 119, 242, 0.1)",
    transform: "scale(1.05)",
  },
  recommendedBadge: {
    position: "absolute" as any,
    top: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--fb-blue)",
    color: "white",
    fontSize: "9px",
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tierName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
    marginBottom: "4px",
  },
  tierPrice: {
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--fb-blue)",
    marginBottom: "2px",
  },
  tierLimit: {
    fontSize: "11px",
    color: "var(--fb-text-secondary)",
    marginBottom: "4px",
  },
  currentPlan: {
    fontSize: "10px",
    color: "var(--fb-text-tertiary)",
    padding: "2px 6px",
    background: "var(--fb-bg-tertiary)",
    borderRadius: "4px",
  },
  savings: {
    fontSize: "10px",
    color: "var(--fb-green)",
    fontWeight: 600,
    padding: "2px 6px",
    background: "rgba(0, 200, 81, 0.1)",
    borderRadius: "4px",
  },
  upgradeButton: {
    width: "100%",
    padding: "16px",
    background: "var(--fb-blue)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginBottom: "12px",
  },
  closeButton: {
    width: "100%",
    padding: "12px",
    background: "transparent",
    color: "var(--fb-text-secondary)",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
  },
}

const styles: { [key: string]: React.CSSProperties } = {
  popupContainer: {
    width: "360px",
    minHeight: "480px",
    backgroundColor: "var(--fb-bg-primary)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    flexDirection: "column" as any,
    borderRadius: "8px",
    overflow: "hidden",
    position: "relative" as any,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "var(--fb-blue)",
    color: "white",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoImage: {
    height: "24px",
    width: "auto",
    display: "block",
  },
  logoText: {
    fontSize: "16px",
    fontWeight: 700,
    color: "white",
    textShadow: "-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000",
  },
  logoAccent: {
    color: "#00FFC2",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  usageBar: {
    padding: "12px 16px",
    background: "var(--fb-bg-secondary)",
    borderBottom: "1px solid var(--fb-border)",
  },
  usageInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  planBadge: {
    padding: "2px 8px",
    background: "var(--fb-blue)",
    color: "white",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "10px",
    textTransform: "uppercase",
  },
  usageText: {
    fontSize: "12px",
    color: "var(--fb-text-secondary)",
  },
  progressBarContainer: {
    width: "100%",
    height: "6px",
    background: "var(--fb-bg-tertiary)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  upgradeLink: {
    marginTop: "8px",
    padding: "6px 12px",
    background: "rgba(255, 152, 0, 0.1)",
    color: "var(--fb-orange)",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
  main: {
    flex: 1,
    padding: "20px",
    display: "flex",
    flexDirection: "column" as any,
  },
  stateContainer: {
    display: "flex",
    flexDirection: "column" as any,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: "16px",
    textAlign: "center" as any,
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid var(--fb-bg-tertiary)",
    borderTop: "4px solid var(--fb-blue)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  stateIcon: {
    fontSize: "48px",
  },
  stateText: {
    color: "var(--fb-text-secondary)",
    fontSize: "14px",
  },
  errorMessage: {
    color: "var(--fb-text-secondary)",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  secondaryButton: {
    padding: "10px 20px",
    background: "var(--fb-bg-secondary)",
    border: "1px solid var(--fb-border)",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--fb-text-primary)",
    cursor: "pointer",
  },
  intentCard: {
    display: "flex",
    flexDirection: "column" as any,
    gap: "12px",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
  },
  intentBadge: {
    padding: "4px 10px",
    background: "var(--fb-blue)",
    color: "white",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "12px",
    textTransform: "uppercase",
  },
  confidenceBadge: {
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "12px",
  },
  productTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
    margin: 0,
  },
  productVariant: {
    fontSize: "13px",
    color: "var(--fb-text-secondary)",
  },
  quoteBox: {
    background: "var(--fb-bg-secondary)",
    borderRadius: "8px",
    padding: "12px",
    borderLeft: "3px solid var(--fb-blue)",
  },
  quoteText: {
    fontSize: "13px",
    color: "var(--fb-text-secondary)",
    fontStyle: "italic",
    margin: 0,
    lineHeight: 1.4,
  },
  primaryButton: {
    width: "100%",
    padding: "12px",
    background: "var(--fb-blue)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "8px",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  buttonLoading: {
    background: "var(--fb-orange)",
    cursor: "not-allowed",
  },
  buttonSuccess: {
    background: "var(--fb-green)",
  },
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  successBadge: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "var(--fb-green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    fontSize: "28px",
    color: "white",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
    margin: 0,
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--fb-text-primary)",
    margin: 0,
  },
  emptyText: {
    fontSize: "13px",
    color: "var(--fb-text-secondary)",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 16px",
    borderTop: "1px solid var(--fb-border)",
    gap: "16px",
    background: "var(--fb-bg-secondary)",
  },
  stat: {
    display: "flex",
    flexDirection: "column" as any,
    alignItems: "center",
    gap: "2px",
  },
  statLabel: {
    fontSize: "10px",
    color: "var(--fb-text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: "14px",
    fontWeight: 700,
  },
  statDivider: {
    width: "1px",
    height: "24px",
    background: "var(--fb-border)",
  },
  legalLinks: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  legalLink: {
    padding: "4px 8px",
    background: "transparent",
    border: "none",
    fontSize: "10px",
    color: "var(--fb-text-tertiary)",
    cursor: "pointer",
    textDecoration: "underline",
    transition: "color 0.2s ease",
  },
}