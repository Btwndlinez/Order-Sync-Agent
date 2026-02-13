/**
 * WhatsApp Content Adapter
 * Observes new messages and sends purchase intent to background router
 */

const CHANNEL = 'whatsapp';

const INTENT_KEYWORDS = [
  'buy', 'take', 'want', 'need', 'order', 'price', '$', 'cost', 
  'ship', 'shipping', 'total', 'size', 'color', 'how much', 
  'available', 'in stock', 'purchase', 'checkout', 'pay'
];

const TARGET_SELECTORS = [
  '[role="row"]',
  '[data-testid="message-row"]',
  '.message',
  '[data-pre-message-id]'
];

/**
 * Lightweight heuristic check for purchase intent
 */
function hasPurchaseIntent(text) {
  if (!text || text.length < 10) return false;
  
  const lowerText = text.toLowerCase();
  
  const hasKeyword = INTENT_KEYWORDS.some(k => lowerText.includes(k));
  const hasDigit = /\d/.test(text);
  const hasPrice = /\$\d+/.test(text);
  
  return (hasKeyword && hasDigit) || hasPrice;
}

/**
 * Extract message text from DOM element
 */
function extractMessageText(element) {
  if (!element) return null;
  
  const text = element.innerText || element.textContent;
  return text ? text.trim() : null;
}

/**
 * Send message to background router
 */
function sendToRouter(text, metadata = {}) {
  chrome.runtime.sendMessage({
    type: 'CHANNEL_MESSAGE',
    payload: {
      source: CHANNEL,
      text: text,
      timestamp: Date.now(),
      url: window.location.href,
      ...metadata
    }
  });
}

/**
 * Setup MutationObserver for WhatsApp
 */
function setupObserver() {
  const container = document.querySelector('#main') || 
                   document.querySelector('[data-testid="conversation-panel"]') ||
                   document.querySelector('[contenteditable="true"]')?.closest('#main');
  
  if (!container) {
    console.log('[WhatsApp Adapter] No chat container found, retrying in 2s...');
    setTimeout(setupObserver, 2000);
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        const messageText = extractMessageText(node);
        if (messageText && hasPurchaseIntent(messageText)) {
          console.log('[WhatsApp Adapter] Purchase intent detected:', messageText.substring(0, 50));
          sendToRouter(messageText, { selector: node.className });
        }
      }
    }
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });

  console.log('[WhatsApp Adapter] Observer active on', window.location.hostname);
}

/**
 * Handle text selection
 */
function handleTextSelection() {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();
  
  if (selectedText && selectedText.length > 10) {
    chrome.storage.local.set({
      lastCapturedText: selectedText,
      captureSource: CHANNEL,
      captureTimestamp: Date.now()
    });
    
    sendToRouter(selectedText, { type: 'selection' });
  }
}

/**
 * Initialize adapter
 */
function initialize() {
  console.log('[WhatsApp Adapter] Initializing on', window.location.hostname);
  
  document.addEventListener('mouseup', handleTextSelection);
  setupObserver();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
