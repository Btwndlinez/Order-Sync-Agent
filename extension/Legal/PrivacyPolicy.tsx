import React from 'react'

export default function PrivacyPolicy() {
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#333'
    },
    header: {
      textAlign: 'center' as any,
      marginBottom: '40px',
      borderBottom: '1px solid #eee',
      paddingBottom: '20px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1877f2',
      margin: '0 0 10px 0'
    },
    subtitle: {
      fontSize: '16px',
      color: '#666',
      margin: '0'
    },
    section: {
      marginBottom: '30px'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1877f2',
      margin: '0 0 15px 0'
    },
    paragraph: {
      fontSize: '14px',
      lineHeight: '1.6',
      margin: '0 0 15px 0',
      color: '#555'
    },
    list: {
      paddingLeft: '20px',
      margin: '15px 0'
    },
    listItem: {
      fontSize: '14px',
      marginBottom: '8px',
      color: '#555'
    },
    contactSection: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      marginTop: '30px'
    },
    lastUpdated: {
      textAlign: 'center' as any,
      fontSize: '12px',
      color: '#999',
      marginTop: '40px',
      paddingTop: '20px',
      borderTop: '1px solid #eee'
    }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.subtitle}>Order Sync Agent Chrome Extension</p>
      </header>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Information We Collect</h2>
        <p style={styles.paragraph}>
          Order Sync Agent collects only the minimum information necessary to provide our service:
        </p>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <strong>Messenger Conversations:</strong> We analyze message content from Facebook Messenger conversations to detect purchase intent and match products.
          </li>
          <li style={styles.listItem}>
            <strong>Usage Data:</strong> We track the number of checkout links generated for billing purposes.
          </li>
          <li style={styles.listItem}>
            <strong>Authentication:</strong> Your Supabase user ID for account management and subscription status.
          </li>
          <li style={styles.listItem}>
            <strong>Browser Storage:</strong> Extension data stored locally in your browser (chrome.storage).
          </li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>How We Use Your Information</h2>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            Generate personalized product recommendations based on conversation content
          </li>
          <li style={styles.listItem}>
            Create Stripe checkout links for products you select
          </li>
          <li style={styles.listItem}>
            Manage your subscription and usage limits
          </li>
          <li style={styles.listItem}>
            Improve our AI matching algorithms
          </li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Data Storage & Security</h2>
        <p style={styles.paragraph}>
          <strong>Local Storage:</strong> All conversation data is stored locally in your browser and is encrypted at rest.
        </p>
        <p style={styles.paragraph}>
          <strong>Cloud Storage:</strong> We use Supabase for user authentication and usage tracking. All data is encrypted in transit and at rest.
        </p>
        <p style={styles.paragraph}>
          <strong>Stripe Integration:</strong> Payment processing is handled entirely by Stripe. We never store credit card information.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Data Sharing</h2>
        <p style={styles.paragraph}>
          We do not sell, rent, or share your personal information with third parties for marketing purposes. We only share data as necessary to:
        </p>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            Process payments through Stripe
          </li>
          <li style={styles.listItem}>
            Store data securely in Supabase
          </li>
          <li style={styles.listItem}>
            Comply with legal requirements
          </li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Data Retention</h2>
        <p style={styles.paragraph}>
          <strong>Local Data:</strong> Stored locally until you uninstall the extension.
        </p>
        <p style={styles.paragraph}>
          <strong>Cloud Data:</strong> Account data is retained until you request deletion. Usage logs are retained for 12 months for billing and analytics purposes.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Rights</h2>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            <strong>Access:</strong> Request a copy of your data at any time
          </li>
          <li style={styles.listItem}>
            <strong>Correction:</strong> Request corrections to inaccurate information
          </li>
          <li style={styles.listItem}>
            <strong>Deletion:</strong> Request deletion of your account and all associated data
          </li>
          <li style={styles.listItem}>
            <strong>Export:</strong> Export your data in a portable format
          </li>
        </ul>
      </section>

      <div style={styles.contactSection}>
        <h3 style={styles.sectionTitle}>Contact Us</h3>
        <p style={styles.paragraph}>
          If you have questions about this Privacy Policy or your data, please contact us:
        </p>
        <p style={styles.paragraph}>
          <strong>Email:</strong> privacy@ordersyncagent.com<br />
          <strong>Website:</strong> https://ordersyncagent.com
        </p>
      </div>

      <footer style={styles.lastUpdated}>
        <p>
          <strong>Last Updated:</strong> February 10, 2026<br />
          <strong>Effective Date:</strong> February 10, 2026
        </p>
      </footer>
    </div>
  )
}