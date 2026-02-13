interface SidebarItem {
  icon: string
  label: string
  active?: boolean
  badge?: number
}

interface LeftSidebarProps {
  activeItem?: string
}

const navItems: SidebarItem[] = [
  { icon: "🏠", label: "Home", active: true },
  { icon: "📋", label: "Leads", badge: 3 },
  { icon: "🤝", label: "Referrals" },
  { icon: "⚙️", label: "Settings" },
]

export function LeftSidebar({ activeItem = "Home" }: LeftSidebarProps) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoSection}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🚀</span>
          <span style={styles.logoText}>Order Sync</span>
        </div>
      </div>
      
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            style={{
              ...styles.navItem,
              ...(item.label === activeItem ? styles.navItemActive : {}),
            }}
            onClick={(e) => {
              e.preventDefault()
              // Handle navigation
            }}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
            {item.badge && (
              <span style={styles.badge}>{item.badge}</span>
            )}
          </a>
        ))}
      </nav>
      
      <div style={styles.footer}>
        <div style={styles.userCard}>
          <div style={styles.userAvatar}>VA</div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>Virtual Assistant</div>
            <div style={styles.userStatus}>● Online</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: "280px",
    height: "100vh",
    background: "var(--fb-bg-secondary)",
    borderRight: "1px solid var(--fb-border)",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 100,
  },
  logoSection: {
    padding: "16px",
    borderBottom: "1px solid var(--fb-border)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoIcon: {
    fontSize: "24px",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--fb-text-primary)",
  },
  nav: {
    flex: 1,
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "8px",
    textDecoration: "none",
    color: "var(--fb-text-primary)",
    transition: "background 0.2s ease",
    cursor: "pointer",
  },
  navItemActive: {
    background: "var(--fb-blue-light)",
    color: "var(--fb-blue)",
  },
  navIcon: {
    fontSize: "20px",
    width: "24px",
    textAlign: "center",
  },
  navLabel: {
    fontSize: "15px",
    fontWeight: 500,
    flex: 1,
  },
  badge: {
    background: "var(--fb-red)",
    color: "white",
    fontSize: "11px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "10px",
  },
  footer: {
    padding: "16px",
    borderTop: "1px solid var(--fb-border)",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "var(--fb-blue)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 600,
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--fb-text-primary)",
  },
  userStatus: {
    fontSize: "12px",
    color: "var(--fb-green)",
  },
}
