/**
 * OrderSyncAgent Panel Entry Point
 * React application for the side panel interface
 */

console.log('OrderSyncAgent Panel Active');

// This will be replaced by the compiled React app
// For now, just a simple placeholder that shows the app is working

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    logo: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        backgroundColor: '#1877F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
    },
    subtitle: {
        fontSize: '12px',
        color: '#6B7280',
    },
    main: {
        padding: '16px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '16px',
        marginBottom: '16px',
    },
    placeholder: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: '14px',
        padding: '32px 16px',
    }
};

// Simple render function
function render() {
    const root = document.getElementById('root');
    if (!root) return;

    root.innerHTML = `
        <div style="${Object.entries(styles.container).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ')}">
            <header style="${Object.entries(styles.header).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ')}">
                <div style="${Object.entries(styles.logo).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ')}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    </svg>
                </div>
                <div>
                    <div style="${Object.entries(styles.title).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ')}">Channel Assist</div>
                    <div style="${Object.entries(styles.subtitle).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ')}">AI-powered order extraction</div>
                </div>
            </header>
            <main style="${Object.entries(styles.main).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ')}">
                <div style="${Object.entries(styles.card).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ')}">
                    <div style="${Object.entries(styles.placeholder).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ')}">
                        <p>Loading Channel Assist...</p>
                    </div>
                </div>
            </main>
        </div>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', render);
