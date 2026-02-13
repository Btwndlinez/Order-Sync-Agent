import { useEffect, useState } from "react"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  usageCount: number
  limit: number
  stripeCheckoutUrl?: string
}

export function UpgradeModal({ isOpen, onClose, usageCount, limit, stripeCheckoutUrl }: UpgradeModalProps) {
  const [show, setShow] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShow(true)
      setConfettiTrigger(true)
      const timer = setTimeout(() => setConfettiTrigger(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [isOpen])

  if (!show && isOpen) return null

  const handleUpgrade = () => {
    if (stripeCheckoutUrl) {
      window.open(stripeCheckoutUrl, "_blank")
    }
    onClose()
  }

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 150)
  }

  const savedMinutes = Math.round(usageCount * 2)

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div
        style={{
          ...styles.modal,
          transform: show ? "scale(1)" : "scale(0.9)",
          opacity: show ? "1" : "0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {confettiTrigger && <div style={styles.confettiEffect} />}

        <div style={styles.glowingBorder}>
          <div style={styles.header}>
            <div style={styles.successIcon}>🎉</div>
            <h2 style={styles.title}>You've reached a Success Milestone!</h2>
            <p style={styles.subtitle}>
              You just saved ~{savedMinutes} minutes of manual typing this month. Don't let the momentum stop.
            </p>
          </div>

          <div style={styles.socialProof}>
            <span style={styles.socialBadge}>Join 500+ Power Sellers</span>
          </div>

          <div style={styles.offerCard}>
            <div style={styles.planHeader}>
              <h3 style={styles.planName}>Pro Plan</h3>
              <span style={styles.planPrice}>$19<span style={styles.planPeriod}>/mo</span></span>
            </div>

            <ul style={styles.featureList}>
              <li style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Unlimited Syncing</span>
              </li>
              <li style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Priority Support</span>
              </li>
              <li style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Advanced Extraction</span>
              </li>
            </ul>

            <button onClick={handleUpgrade} style={styles.upgradeButton}>
              Upgrade to Pro
            </button>
          </div>

          <button onClick={handleClose} style={styles.laterButton}>
            Maybe later, I'll stick to {limit} links/mo
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    width: "340px",
    background: "var(--fb-bg-secondary)",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 02)",
    transition: "all 0.2s ease",
    position: "relative",
    overflow: "hidden",
  },
  glowingBorder: {
    position: "relative",
    zIndex: 1,
  },
  confettiEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 60%, rgba(245, 158, 11, 0.05) 0%, transparent 40%)
    `,
    pointerEvents: "none",
    zIndex: -1,
    animation: "confettiPop 0.5s ease-out",
  },
  header: {
    textAlign: "center",
    marginBottom: "16px",
  },
  successIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },
  title: {
    fontSize: "20px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
    marginBottom: "8px",
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--fb-text-secondary)",
    lineHeight: 1.5,
  },
  socialProof: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  socialBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    background: "linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(16, 185, 129, 0.1))",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--fb-text-secondary)",
    border: "1px solid rgba(79, 70, 229, 0.2)",
  },
  offerCard: {
    background: "var(--fb-bg-tertiary)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
  },
  planHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  planName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
  },
  planPrice: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--fb-blue)",
  },
  planPeriod: {
    fontSize: "14px",
    fontWeight: 400,
    color: "var(--fb-text-tertiary)",
  },
  featureList: {
    listStyle: "none",
    marginBottom: "20px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "var(--fb-text-primary)",
    marginBottom: "8px",
  },
  featureIcon: {
    color: "var(--fb-green)",
    fontWeight: 700,
  },
  upgradeButton: {
    width: "100%",
    padding: "14px 20px",
    background: "#4F46E5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
  },
  laterButton: {
    width: "100%",
    padding: "10px",
    background: "transparent",
    border: "none",
    fontSize: "13px",
    color: "var(--fb-text-tertiary)",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
}
