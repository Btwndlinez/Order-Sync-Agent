/**
 * Multi-Platform Message Extraction Engine
 * Layered Resilience: Primary → Secondary → Fallback selectors
 * Health Monitoring: Heartbeat for selector failures
 */

const PLATFORM = {
  WHATSAPP: 'whatsapp',
  MESSENGER: 'messenger'
};

/**
 * Multi-Selector Registry
 * Tiered approach: primary (most reliable) → secondary → fallback
 */
const SELECTORS = {
  [PLATFORM.WHATSAPP]: {
    primary: [
      '#main [role="row"][tabindex="-1"]',
      '[data-testid="message-row"]',
      'div[role="row"][aria-label*="message"]'
    ],
    secondary: [
      '#main > div > div > div[role="row"]',
      'div[dir="auto"][role="presentation"]',
      '.message.focusable-list-item'
    ],
    fallback: [
      '#main div[tabindex]',
      '[data-testid="conversation-panel"] div[dir="auto"]',
      'div[contenteditable="true"]'
    ],
    container: [
      '#main',
      '[data-testid="conversation-panel"]',
      '[role="application"]'
    ]
  },
  [PLATFORM.MESSENGER]: {
    primary: [
      '[role="main"] [role="row"]',
      '[aria-label="Messages"] [role="group"]',
      '[data-pagelet="MessengerGroupThread"] > div > div'
    ],
    secondary: [
      'div[aria-label*="Message"]',
      '[data-pagelet="MessageRequest"]',
      '[data-pagelet="ThreadList"]'
    ],
    fallback: [
      '[role="main"] div[dir="auto"]',
      'div[aria-label="Message"]',
      '[role="dialog"]'
    ],
    container: [
      '[role="main"]',
      '[aria-label="Messages"]',
      '[data-pagelet="MessengerGroupThread"]'
    ]
  }
};

/**
 * UI Noise Patterns
 * Filter out timestamps, typing indicators, UI labels
 */
const NOISE_PATTERNS = {
  timestamps: [
    /^\d{1,2}:\d{2}\s*(AM|PM)?$/i,
    /^\d{1,2}:\d{2}\s*$/,
    /^(Today|Yesterday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i,
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/
  ],
  uiLabels: [
    /^typing…?$/i,
    /^online$/i,
    /^active now$/i,
    /^seen$/i,
    /^delivered$/i,
    /^sent$/i,
    /^last seen/i,
    /^\u2713\u2713$/,
    /^\u2714$/,
    /^\u00A0+$/
  ],
  systemMessages: [
    /^(you|yours|your) (started|created) (a|a new) (group|call|video)/i,
    /^(someone|someone else) (added|removed|left)/i,
    /^messages and calls are end-to-end encrypted/i
  ]
};

/**
 * Heuristic Validator
 * Filter out noise and invalid messages
 */
function isValidMessage(text, options = {}) {
  const {
    minLength = 5,
    maxLength = 2000,
    allowNumbers = true
  } = options;

  if (!text || typeof text !== 'string') {
    return { valid: false, reason: 'empty' };
  }

  const trimmed = text.trim();
  const length = trimmed.length;

  // Length check
  if (length < minLength) {
    return { valid: false, reason: 'too_short' };
  }

  if (length > maxLength) {
    return { valid: false, reason: 'too_long' };
  }

  // Timestamp check
  for (const pattern of NOISE_PATTERNS.timestamps) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'timestamp' };
    }
  }

  // UI Label check
  for (const pattern of NOISE_PATTERNS.uiLabels) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'ui_label' };
    }
  }

  // System message check
  for (const pattern of NOISE_PATTERNS.systemMessages) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'system_message' };
    }
  }

  // Must have at least some alphabetic characters
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { valid: false, reason: 'no_alpha' };
  }

  return { valid: true, reason: null };
}

/**
 * Relative Traversal Helper
 * Find chat container first, then traverse for message nodes
 */
function findContainer(platform) {
  const containerSelectors = SELECTORS[platform]?.container || [];
  
  for (const selector of containerSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    } catch (e) {
      continue;
    }
  }
  
  return document.body;
}

/**
 * Get Latest Messages
 * Iterates through selector tiers until messages found
 */
function getLatestMessages(platform, options = {}) {
  const {
    limit = 10,
    includeInvalid = false
  } = options;

  const selectorTier = SELECTORS[platform];
  if (!selectorTier) {
    console.warn('[Extractor] Unknown platform:', platform);
    return [];
  }

  // Try each tier: primary → secondary → fallback
  const tiers = ['primary', 'secondary', 'fallback'];
  
  for (const tier of tiers) {
    const selectors = selectorTier[tier];
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        
        if (elements.length > 0) {
          const messages = Array.from(elements)
            .slice(-limit)
            .map(el => ({
              element: el,
              text: el.innerText?.trim() || el.textContent?.trim() || '',
              html: el.innerHTML,
              selector: selector,
              tier: tier
            }))
            .filter(msg => msg.text.length > 0);

          if (messages.length > 0) {
            // Validate messages
            const validated = includeInvalid 
              ? messages 
              : messages.filter(msg => isValidMessage(msg.text).valid);

            console.log(`[Extractor] ${platform}: Found ${validated.length} messages using ${tier} selector`);
            return validated;
          }
        }
      } catch (e) {
        console.warn(`[Extractor] Selector error (${tier}):`, selector, e.message);
        continue;
      }
    }
  }

  // Fallback: Use relative traversal
  console.log('[Extractor] Selector tiers exhausted, trying relative traversal');
  return relativeTraversal(platform, limit);
}

/**
 * Relative Traversal Fallback
 * Find container, then find text nodes within
 */
function relativeTraversal(platform, limit = 10) {
  const container = findContainer(platform);
  if (!container) {
    return [];
  }

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const text = node.textContent?.trim() || '';
        if (text.length < 5) return NodeFilter.FILTER_REJECT;
        if (text.length > 2000) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const messages = [];
  let node;
  
  while ((node = walker.nextNode()) && messages.length < limit) {
    const text = node.textContent?.trim();
    if (text && isValidMessage(text).valid) {
      messages.push({
        element: node.parentElement,
        text: text,
        html: node.parentElement?.innerHTML || '',
        selector: 'relative_traversal',
        tier: 'fallback'
      });
    }
  }

  return messages;
}

/**
 * Health Monitoring
 * Heartbeat for selector failures
 */
class HealthMonitor {
  constructor(platform, options = {}) {
    this.platform = platform;
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.maxFailures = options.maxFailures || 3;
    this.failures = 0;
    this.lastSuccess = Date.now();
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.heartbeat();
    }, this.checkInterval);
    
    console.log(`[HealthMonitor] Started for ${this.platform}`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  heartbeat() {
    const messages = getLatestMessages(this.platform, { limit: 1 });
    
    if (messages.length === 0) {
      this.failures++;
      
      // Log warning to background
      if (this.failures >= this.maxFailures) {
        this.logSelectorFailure();
      }
    } else {
      this.failures = 0;
      this.lastSuccess = Date.now();
    }
  }

  logSelectorFailure() {
    const message = {
      type: 'SELECTOR_FAILURE',
      platform: this.platform,
      timestamp: Date.now(),
      url: window.location.href,
      failureCount: this.failures,
      selectorTiers: Object.keys(SELECTORS[this.platform] || {})
    };

    console.warn('[HealthMonitor] SELECTOR_FAILURE:', message);

    // Send to background
    try {
      chrome.runtime.sendMessage({
        type: 'HEALTH_ALERT',
        payload: message
      });
    } catch (e) {
      // Not in extension context
    }
  }

  isHealthy() {
    return this.failures < this.maxFailures;
  }

  getStats() {
    return {
      platform: this.platform,
      failures: this.failures,
      lastSuccess: this.lastSuccess,
      healthy: this.isHealthy()
    };
  }
}

// Export for use in adapters
if (typeof window !== 'undefined') {
  window.MessageExtractor = {
    PLATFORM,
    SELECTORS,
    isValidMessage,
    getLatestMessages,
    relativeTraversal,
    HealthMonitor
  };
}

export {
  PLATFORM,
  SELECTORS,
  isValidMessage,
  getLatestMessages,
  relativeTraversal,
  HealthMonitor
};
