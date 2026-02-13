/**
 * WhatsApp Floating Detection Indicator
 * Non-invasive pill that appears when high-intent message detected
 */

(function() {
  const STYLES = `
    .ordersync-detector-pill {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #1877F2 0%, #166fe5 100%);
      color: white;
      border-radius: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(24, 119, 242, 0.4);
      animation: ordersync-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: default;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .ordersync-detector-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(24, 119, 242, 0.5);
    }
    
    .ordersync-detector-pill .ordersync-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: ordersync-pulse 2s infinite;
    }
    
    .ordersync-detector-pill .ordersync-text {
      flex: 1;
    }
    
    .ordersync-detector-pill .ordersync-view-btn {
      padding: 6px 14px;
      background: white;
      color: #1877F2;
      border: none;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .ordersync-detector-pill .ordersync-view-btn:hover {
      background: #f0f7ff;
      transform: scale(1.05);
    }
    
    @keyframes ordersync-slide-in {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes ordersync-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    .ordersync-detector-pill.ordersync-fade-out {
      animation: ordersync-fade-out 0.3s ease forwards;
    }
    
    @keyframes ordersync-fade-out {
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }
  `;

  let currentPill = null;
  let hideTimeout = null;

  function injectStyles() {
    if (document.getElementById('ordersync-detector-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'ordersync-detector-styles';
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
  }

  function createPill(messagePreview) {
    removePill();
    
    injectStyles();
    
    const pill = document.createElement('div');
    pill.className = 'ordersync-detector-pill';
    pill.innerHTML = `
      <div class="ordersync-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </div>
      <span class="ordersync-text">Order Detected: "${messagePreview}"</span>
      <button class="ordersync-view-btn">View</button>
    `;
    
    const viewBtn = pill.querySelector('.ordersync-view-btn');
    viewBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
      hidePill();
    });
    
    document.body.appendChild(pill);
    currentPill = pill;
    
    // Auto-hide after 15 seconds
    hideTimeout = setTimeout(hidePill, 15000);
  }

  function hidePill() {
    if (!currentPill) return;
    currentPill.classList.add('ordersync-fade-out');
    setTimeout(removePill, 300);
    if (hideTimeout) clearTimeout(hideTimeout);
  }

  function removePill() {
    if (currentPill && currentPill.parentNode) {
      currentPill.parentNode.removeChild(currentPill);
    }
    currentPill = null;
  }

  // Expose global function for external callers
  window.OrderSyncDetector = {
    show: createPill,
    hide: hidePill,
    remove: removePill
  };
})();
