import React from 'react'

export default function TermsOfService() {
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
    pricingSection: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      margin: '20px 0'
    },
    pricingTier: {
      marginBottom: '15px',
      padding: '15px',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: '1px solid #e1e5e9'
    },
    tierName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1877f2',
      margin: '0 0 5px 0'
    },
    tierPrice: {
      fontSize: '14px',
      color: '#666',
      margin: '0 0 10px 0'
    },
    tierFeatures: {
      fontSize: '13px',
      color: '#555',
      margin: 0
    },
    disclaimer: {
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '6px',
      padding: '15px',
      margin: '20px 0'
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
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.subtitle}>Order Sync Agent Chrome Extension</p>
      </header>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Acceptance of Terms</h2>
        <p style={styles.paragraph}>
          By installing and using the Order Sync Agent Chrome extension ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
          If you do not agree to these Terms, you must not use our Service.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Description of Service</h2>
        <p style={styles.paragraph}>
          Order Sync Agent is a Chrome extension that analyzes Facebook Messenger conversations to detect purchase intent and 
          generates product checkout links. The Service integrates with Shopify stores and Stripe for payment processing.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>User Responsibilities</h2>
        <p style={styles.paragraph}>
          As a user of Order Sync Agent, you agree to:
        </p>
        <ul style={styles.list}>
          <li style={styles.listItem}>
            Use the Service for lawful purposes only
          </li>
          <li style={styles.listItem}>
            Provide accurate information when required
          </li>
          <li style={styles.listItem}>
            Maintain the security of your account credentials
          </li>
          <li style={styles.listItem}>
            Comply with all applicable laws and regulations
          </li>
          <li style={styles.listItem}>
            Not attempt to reverse engineer or circumvent Service limitations
          </li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Subscription Plans & Usage</h2>
        <div style={styles.pricingSection}>
          <div style={styles.pricingTier}>
            <div style={styles.tierName}>Starter Plan</div>
            <div style={styles.tierPrice}>$19/month - 20 checkout links</div>
            <p style={styles.tierFeatures}>
              Includes basic AI matching and email support
            </p>
          </div>
          
          <div style={styles.pricingTier}>
            <div style={styles.tierName}>Pro Plan</div>
            <div style={styles.tierPrice}>$49/month - 200 checkout links</div>
            <p style={styles.tierFeatures}>
              Includes advanced AI matching, priority support, and API access
            </p>
          </div>
          
          <div style={styles.pricingTier}>
            <div style={styles.tierName}>Scale Plan</div>
            <div style={styles.tierPrice}>$149/month - 1000 checkout links</div>
            <p style={styles.tierFeatures}>
              Includes all features plus premium analytics and custom integrations
            </p>
          </div>
        </div>
        
        <p style={styles.paragraph}>
          <strong>Usage Limits:</strong> Each plan has a monthly limit on checkout links generated. 
          Usage counters reset at the beginning of each billing cycle. Additional links require upgrading to a higher tier.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Payment Terms</h2>
        <p style={styles.paragraph}>
          <strong>Subscription Billing:</strong> Charges are processed monthly through Stripe. 
          You authorize us to charge your payment method on a recurring basis.
        </p>
        <p style={styles.paragraph}>
          <strong>Refunds:</strong> Refunds are available within 7 days of the initial purchase. 
          No prorated refunds for partial months of service.
        </p>
        <p style={styles.paragraph}>
          <strong>Plan Changes:</strong> You can upgrade or downgrade your plan at any time. 
          Changes take effect at the start of the next billing cycle.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Data & Intellectual Property</h2>
        <p style={styles.paragraph}>
          <strong>Your Data:</strong> You retain ownership of all conversation data and customer information. 
          We only process this data to provide the Service.
        </p>
        <p style={styles.paragraph}>
          <strong>Our Intellectual Property:</strong> The Order Sync Agent service, including its algorithms, 
          user interface, and technology, is protected by intellectual property laws.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Service Availability</h2>
        <p style={styles.paragraph}>
          We strive to maintain high availability but do not guarantee uninterrupted service. 
          The Service may be temporarily unavailable for maintenance, updates, or technical issues.
        </p>
      </section>

      <div style={styles.disclaimer}>
        <h3 style={styles.sectionTitle}>Important Disclaimers</h3>
        <p style={styles.paragraph}>
          <strong>AI Matching:</strong> Our product matching is powered by AI and may not always be 100% accurate. 
          You should verify all product recommendations before sending to customers.
        </p>
        <p style={styles.paragraph}>
          <strong>Third-Party Services:</strong> Our Service depends on Facebook Messenger, Shopify, and Stripe. 
          We are not responsible for issues caused by these third-party services.
        </p>
        <p style={styles.paragraph}>
          <strong>Earnings Claims:</strong> We do not guarantee any specific level of sales or revenue. 
          Your success depends on many factors outside our control.
        </p>
      </div>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Limitation of Liability</h2>
        <p style={styles.paragraph}>
          To the maximum extent permitted by law, Order Sync Agent shall not be liable for any indirect, 
          incidental, special, or consequential damages resulting from your use of the Service.
        </p>
        <p style={styles.paragraph}>
          Our total liability shall not exceed the amount you paid for the Service in the preceding 12 months.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Termination</h2>
        <p style={styles.paragraph}>
          You may terminate your account at any time by uninstalling the extension or canceling your subscription.
        </p>
        <p style={styles.paragraph}>
          We may terminate or suspend access to the Service for violation of these Terms or for any other reason 
          with appropriate notice.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Changes to Terms</h2>
        <p style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. 
          Significant changes will be communicated via email or through the extension interface.
        </p>
        <p style={styles.paragraph}>
          Continued use of the Service after changes constitutes acceptance of the modified Terms.
        </p>
      </section>

      <div style={styles.contactSection}>
        <h3 style={styles.sectionTitle}>Contact Information</h3>
        <p style={styles.paragraph}>
          If you have questions about these Terms of Service, please contact us:
        </p>
        <p style={styles.paragraph}>
          <strong>Email:</strong> support@ordersyncagent.com<br />
          <strong>Website:</strong> https://ordersyncagent.com<br />
          <strong>Response Time:</strong> We respond to all inquiries within 48 business hours
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