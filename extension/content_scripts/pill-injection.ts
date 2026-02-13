/**
 * Resilient WhatsApp Pill Injection
 * Uses Shadow DOM to survive React re-renders
 */

(function() {
  const CONFIG = {
    hostId: 'ordersync-pill-host',
    shadowMode: 'open' as ShadowRootMode,
    minConfidence: 0.8,
    colors: {
      primary: '#25D366',
      text: '#FFFFFF',
      hover: '#20BD5A'
    }
  };

  let pillHost: HTMLDivElement | null = null;
  let shadowRoot: ShadowRoot | null = null;
  let observer: MutationObserver | null = null;
  let currentMessage: string | null = null;
  let currentConfidence: number = 0;

  function injectStyles(): string {
    return `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .ordersync-pill {
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 18px;
        background: ${CONFIG.colors.primary};
        color: ${CONFIG.colors.text};
        border-radius: 50px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 
          0 4px 20px rgba(37, 211, 102, 0.4),
          0 8px 32px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        animation: ordersync-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        user-select: none;
      }
      
      .ordersync-pill:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 
          0 6px 28px rgba(37, 211, 102, 0.5),
          0 12px 40px rgba(0, 0, 0, 0.25);
      }
      
      .ordersync-pill:active {
        transform: translateY(0) scale(0.98);
      }
      
      .ordersync-pill .ordersync-icon {
        font-size: 16px;
        animation: ordersync-bounce 1s ease infinite;
      }
      
      .ordersync-pill .ordersync-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }
      
      .ordersync-pill .ordersync-view {
        padding: 6px 14px;
        background: rgba(255, 255, 255, 0.25);
        border-radius: 20px;
        font-size: 12px;
        transition: background 0.2s ease;
      }
      
      .ordersync-pill .ordersync-view:hover {
        background: rgba(255, 255, 255, 0.35);
      }
      
      .ordersync-pill.ordersync-hide {
        animation: ordersync-fade-out 0.3s ease forwards;
        pointer-events: none;
      }
      
      @keyframes ordersync-slide-in {
        from {
          opacity: 0;
          transform: translateX(100px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
      
      @keyframes ordersync-fade-out {
        to {
          opacity: 0;
          transform: translateY(-20px) scale(0.9);
        }
      }
      
      @keyframes ordersync-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
    `;
  }

  function createPill(message: string): void {
    if (pillHost && shadowRoot) {
      showPill(message);
      return;
    }

    // Create host div
    pillHost = document.createElement('div');
    pillHost.id = CONFIG.hostId;
    pillHost.style.cssText = 'all: initial;';

    // Attach shadow root
    shadowRoot = pillHost.attachShadow({ mode: CONFIG.shadowMode });

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = injectStyles();
    shadowRoot.appendChild(styleEl);

    // Create pill element
    const pill = document.createElement('div');
    pill.className = 'ordersync-pill';
    pill.innerHTML = `
      <span class="ordersync-icon">✨</span>
      <span class="ordersync-text">Order Detected</span>
      <span class="ordersync-view">View</span>
    `;

    // Click handler
    pill.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'OPEN_SIDEBAR' });
      hidePill();
    });

    shadowRoot.appendChild(pill);

    // Find target position
    const target = findChatHeader();
    if (target) {
      target.appendChild(pillHost!);
    } else {
      document.body.appendChild(pillHost!);
    }

    showPill(message);
  }

  function showPill(message: string): void {
    if (!shadowRoot) return;
    
    const pill = shadowRoot.querySelector('.ordersync-pill');
    if (pill) {
      pill.classList.remove('ordersync-hide');
      const textEl = pill.querySelector('.ordersync-text');
      if (textEl) {
        textEl.textContent = message.length > 25 
          ? message.substring(0, 25) + '...' 
          : message;
      }
    }
    
    // Auto-hide after 20 seconds
    setTimeout(hidePill, 20000);
  }

  function hidePill(): void {
    if (!shadowRoot) return;
    
    const pill = shadowRoot.querySelector('.ordersync-pill');
    if (pill) {
      pill.classList.add('ordersync-hide');
      setTimeout(removePill, 300);
    }
  }

  function removePill(): void {
    if (pillHost && pillHost.parentNode) {
      pillHost.parentNode.removeChild(pillHost);
    }
    pillHost = null;
    shadowRoot = null;
  }

  function findChatHeader(): HTMLElement | null {
    // Try multiple selectors for WhatsApp Web
    const selectors = [
      '#main > header',
      '[data-testid="conversation-info-header"]',
      'header._1G3Wz',
      '.app-wrapper-web header'
    ];
    
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el as HTMLElement;
    }
    
    return null;
  }

  function setupResilienceObserver(): void {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver((_mutations) => {
      // Check if our pill was removed
      if (!pillHost || !document.contains(pillHost)) {
        // Re-inject if we have a pending message
        if (currentMessage && currentConfidence >= CONFIG.minConfidence) {
          createPill(currentMessage);
        }
      }

      // Also check if pill host exists but is empty
      if (pillHost && pillHost.children.length === 0 && currentMessage) {
        createPill(currentMessage);
      }
    });

    // Watch the entire document for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function initialize(): void {
    // Set up resilience observer
    setupResilienceObserver();

    // Listen for messages from background script
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
        if (message.type === 'SHOW_PILL') {
          const msg = message.payload?.message || 'Order Detected';
          currentMessage = msg;
          currentConfidence = message.payload?.confidence || 0;

          if (currentConfidence >= CONFIG.minConfidence && currentMessage) {
            createPill(currentMessage);
          }
        }
        
        if (message.type === 'HIDE_PILL') {
          hidePill();
          currentMessage = null;
          currentConfidence = 0;
        }
      });
    }

    console.log('[OrderSync] Resilient Pill Injection initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expose global API
  (window as any).OrderSyncPill = {
    show: (message: string, confidence: number) => {
      if (confidence >= CONFIG.minConfidence) {
        createPill(message);
      }
    },
    hide: hidePill,
    destroy: () => {
      if (observer) observer.disconnect();
      removePill();
    }
  };
})();
