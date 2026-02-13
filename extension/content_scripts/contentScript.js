/**
 * Content Script for Order Sync Agent
 * Handles text selection and message capture from WhatsApp/Messenger
 */

// Minimum selection length to trigger capture
const MIN_SELECTION_LENGTH = 10;

// Intent keywords for lightweight heuristic filter
const INTENT_KEYWORDS = ['buy', 'take', 'want', 'need', 'order', 'price', '$', 'cost', 'ship', 'shipping', 'total', 'size', 'color'];

/**
 * Lightweight Intent Filter
 * Check if text contains purchase intent indicators
 */
function shouldProcess(text) {
    if (!text || text.length < 15) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for intent keywords
    const hasKeyword = INTENT_KEYWORDS.some(k => lowerText.includes(k));
    
    // Check for numeric values (prices/quantities)
    const hasDigit = /\d/.test(text);
    const hasPrice = /\$\d+/.test(text);
    
    return (hasKeyword && hasDigit) || hasPrice;
}

/**
 * Capture selected text on mouseup event
 */
function handleMouseUp() {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    
    // Only capture if selection is meaningful (> 10 chars)
    if (selectedText.length > MIN_SELECTION_LENGTH) {
        // Store in chrome.storage.local for panel access
        chrome.storage.local.set({ 
            lastCapturedText: selectedText,
            captureTimestamp: Date.now()
        });
        
        console.log('[OrderSyncAgent] Text captured:', selectedText.substring(0, 50) + '...');
    }
}

/**
 * MutationObserver for passive message detection
 */
function setupMutationObserver() {
    // Determine target selector based on platform
    let targetSelector;
    const hostname = window.location.hostname;
    
    if (hostname.includes('whatsapp')) {
        // WhatsApp message container
        targetSelector = '[role="row"], [data-testid="message-row"], .message';
    } else if (hostname.includes('messenger')) {
        // Messenger main content area
        targetSelector = '[role="main"], [aria-label="Messages"]';
    } else {
        // Generic fallback
        targetSelector = '[contenteditable="true"], .message, [role="main"]';
    }

    const targetNode = document.querySelector(targetSelector);
    
    if (!targetNode) {
        console.log('[OrderSyncAgent] No chat container found, retrying...');
        setTimeout(setupMutationObserver, 1000);
        return;
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Extract text from new message
                    const messageText = node.innerText || node.textContent || '';
                    
                    if (shouldProcess(messageText)) {
                        console.log('[OrderSyncAgent] Purchase intent detected:', messageText.substring(0, 50) + '...');
                        
                        // Send to side panel
                        chrome.runtime.sendMessage({
                            type: 'CONTEXT_DETECTED',
                            payload: messageText.trim()
                        });
                    }
                }
            }
        }
    });

    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });

    console.log('[OrderSyncAgent] MutationObserver active on', targetSelector);
}

/**
 * Listen for messages from the side panel
 * Allows panel to request a scrape of the active chat
 */
function handleRuntimeMessage(request, sender, sendResponse) {
    if (request.action === 'SCRAPE_CHAT') {
        // Get all visible text from the chat container
        const chatContainer = document.querySelector('[contenteditable="true"]') || 
                           document.querySelector('.message') ||
                           document.querySelector('[data-testid="conversation-panel"]');
        
        if (chatContainer) {
            const chatText = chatContainer.innerText || chatText.textContent || '';
            sendResponse({ 
                success: true, 
                text: chatText.trim(),
                timestamp: Date.now() 
            });
        } else {
            sendResponse({ 
                success: false, 
                error: 'Chat container not found' 
            });
        }
    }
    
    return true; // Keep message channel open for async response
}

/**
 * Send captured text to background relay
 */
function sendToBackground(text) {
    chrome.runtime.sendMessage({
        action: 'CAPTURED_TEXT',
        text: text,
        source: window.location.hostname,
        timestamp: Date.now()
    });
}

// Initialize listeners
function initialize() {
    // Listen for text selection
    document.addEventListener('mouseup', handleMouseUp);
    
    // Listen for messages from side panel
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    
    // Setup passive observer for new messages
    setupMutationObserver();
    
    console.log('[OrderSyncAgent] Content script initialized on', window.location.hostname);
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
