import { ThemeToggle } from "./ThemeToggle"

interface AIScoreData {
  score: number
  label: string
  lastUpdated: string
}

interface SLAAlert {
  id: string
  type: "urgent" | "warning" | "info"
  message: string
  timestamp: string
}

interface RightSidebarProps {
  aiScore?: AIScoreData
  slaAlerts?: SLAAlert[]
}

export function RightSidebar({
  aiScore = { score: 85, label: "Hot Lead", lastUpdated: "2 min ago" },
  slaAlerts = [
    { id: "1", type: "urgent", message: "Lead #2341 needs response (SLA: 5 min)", timestamp: "3 min ago" },
  ],
}: RightSidebarProps) {
  const getScoreStyle = (score: number) => {
    if (score >= 80) return { background: "rgba(0, 200, 81, 0.1)", color: "#00C851" }
    if (score >= 50) return { background: "rgba(255, 152, 0, 0.1)", color: "#FF9800" }
    return { background: "rgba(255, 68, 68, 0.1)", color: "#FF4444" }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return "🔴"
      case "warning":
        return "🟡"
      case "info":
        return "🔵"
      default:
        return "ℹ️"
    }
  }

  return (
    <aside style={styles.sidebar}>
      {/* Header with Theme Toggle */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Context</span>
        <ThemeToggle />
      </div>

      {/* AI Qualify Score Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>AI Qualify Score</span>
        </div>
        <div style={styles.scoreContainer}>
          <div
            style={{
              ...styles.scoreCircle,
              borderColor: getScoreStyle(aiScore.score).color,
            }}
          >
            <span
              style={{
                ...styles.scoreValue,
                color: getScoreStyle(aiScore.score).color,
              }}
            >
              {aiScore.score}
            </span>
          </div>
          <div style={styles.scoreLabel}>
            <span
              style={{
                ...styles.scoreBadge,
                background: getScoreStyle(aiScore.score).background,
                color: getScoreStyle(aiScore.score).color,
              }}
            >
              {aiScore.label}
            </span>
          </div>
        </div>
        <div style={styles.scoreFooter}>Updated {aiScore.lastUpdated}</div>
      </div>

      {/* SLA Alerts Section */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>SLA Alerts</span>
          {slaAlerts.length > 0 && (
            <span style={styles.alertCount}>{slaAlerts.length}</span>
          )}
        </div>
        <div style={styles.alertsContainer}>
          {slaAlerts.length === 0 ? (
            <div style={styles.noAlerts}>✓ All caught up!</div>
          ) : (
            slaAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  ...styles.alertItem,
                  ...(alert.type === "urgent" ? styles.alertUrgent : {}),
                }}
              >
                <span style={styles.alertIcon}>{getAlertIcon(alert.type)}</span>
                <div style={styles.alertContent}>
                  <div style={styles.alertMessage}>{alert.message}</div>
                  <div style={styles.alertTime}>{alert.timestamp}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>Today's Stats</span>
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <div style={styles.statValue}>24</div>
            <div style={styles.statLabel}>Leads</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>18</div>
            <div style={styles.statLabel}>Responses</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statValue}>3m</div>
            <div style={styles.statLabel}>Avg Response</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: "320px",
    height: "100vh",
    background: "var(--fb-bg-secondary)",
    borderLeft: "1px solid var(--fb-border)",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    right: 0,
    top: 0,
    zIndex: 100,
    padding: "16px",
    gap: "16px",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "16px",
    borderBottom: "1px solid var(--fb-border)",
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
  },
  card: {
    background: "var(--fb-bg-tertiary)",
    borderRadius: "8px",
    padding: "16px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--fb-text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  scoreContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "16px 0",
  },
  scoreCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    border: "4px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--fb-bg-secondary)",
  },
  scoreValue: {
    fontSize: "28px",
    fontWeight: 700,
  },
  scoreLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  scoreBadge: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 600,
  },
  scoreFooter: {
    textAlign: "center",
    fontSize: "12px",
    color: "var(--fb-text-tertiary)",
    marginTop: "8px",
  },
  alertCount: {
    background: "var(--fb-red)",
    color: "white",
    fontSize: "11px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "10px",
  },
  alertsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  noAlerts: {
    textAlign: "center",
    padding: "16px",
    color: "var(--fb-green)",
    fontSize: "14px",
  },
  alertItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px",
    background: "var(--fb-bg-secondary)",
    borderRadius: "8px",
    border: "1px solid transparent",
  },
  alertUrgent: {
    borderColor: "rgba(255, 68, 68, 0.3)",
    animation: "slaPulse 2s ease-in-out infinite",
  },
  alertIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: "13px",
    color: "var(--fb-text-primary)",
    lineHeight: 1.4,
    marginBottom: "4px",
  },
  alertTime: {
    fontSize: "11px",
    color: "var(--fb-text-tertiary)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  statItem: {
    textAlign: "center",
    padding: "12px",
    background: "var(--fb-bg-secondary)",
    borderRadius: "8px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: 700,
    color: "var(--fb-blue)",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "11px",
    color: "var(--fb-text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
}
