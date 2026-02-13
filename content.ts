/**
 * Order Sync Agent - Ghost-Reader (Content Script)
 * CRITICAL: This must work before popup.tsx can function
 * 
 * Bottom-Up Build Priority:
 * 1. This content script captures Messenger DOM data
 * 2. Saves to chrome.storage.session
 * 3. popup.tsx reads from storage
 */

import type { PlasmoCSConfig } from "plasmo"

// Manifest V3 Configuration
export const config: PlasmoCSConfig = {
    matches: ["https://www.messenger.com/*", "https://messenger.com/*"],
    run_at: "document_idle",
    all_frames: false
}

interface GhostMessage {
    text: string;
    isSeller: boolean;
    timestamp: number;
}

// Constants
const MAX_MESSAGES = 20;
const STORAGE_KEY = 'lastConversation';

// Multiple selectors to try (Messenger changes these frequently)
const MESSAGE_SELECTORS = [
    '[role="presentation"] [dir="auto"]',  // Current primary
    '[data-testid="message_text"]',          // Alternative test ID
    'div[dir="auto"][class*="message"]',    // Class-based fallback
    '[data-scope="messages_table"] span',     // Legacy selector
];

// Seller detection selectors
const SELLER_SELECTORS = [
    '[data-testid="outgoing_message"]',
    '.__fb-dark-mode',  // Outgoing messages often have dark mode class
    '[class*="outgoing"]',
    '[data-testid="message_container"][class*="sent"]',
];

/**
 * Try multiple selectors to find message nodes
 */
function findMessageNodes(): NodeListOf<Element> | null {
    for (const selector of MESSAGE_SELECTORS) {
        try {
            const nodes = document.querySelectorAll(selector);
            if (nodes.length > 0) {
                console.log(`[Ghost-Reader] Found ${nodes.length} messages with selector: ${selector}`);
                return nodes;
            }
        } catch (e) {
            console.warn(`[Ghost-Reader] Selector failed: ${selector}`, e);
        }
    }
    return null;
}

/**
 * Check if a message node is from the seller (outgoing)
 */
function isSellerMessage(node: Element): boolean {
    for (const selector of SELLER_SELECTORS) {
        try {
            if (node.closest(selector) !== null) {
                return true;
            }
        } catch (e) {
            // Ignore invalid selectors
        }
    }
    return false;
}

/**
 * Extract text content from a message node
 */
function extractMessageText(node: Element): string {
    // Try innerText first (visible text)
    const text = (node as HTMLElement).innerText?.trim();
    if (text) return text;
    
    // Fallback to textContent
    return node.textContent?.trim() || '';
}

/**
 * Main function: Capture messages and save to storage
 */
const updateBuffer = () => {
    try {
        const messageNodes = findMessageNodes();

        if (!messageNodes || messageNodes.length === 0) {
            console.log('[Ghost-Reader] No messages found yet...');
            return;
        }

        // Convert nodes to message objects
        const messages: GhostMessage[] = Array.from(messageNodes)
            .slice(-MAX_MESSAGES)  // Keep only last N messages
            .map((node, index) => {
                const text = extractMessageText(node);
                const isSeller = isSellerMessage(node);
                
                return {
                    text,
                    isSeller,
                    timestamp: Date.now() - (messageNodes.length - index) * 1000, // Approximate timestamps
                };
            })
            .filter(msg => msg.text.length > 0);  // Remove empty messages

        if (messages.length === 0) {
            console.log('[Ghost-Reader] No valid message text extracted');
            return;
        }

        // Save to chrome.storage.session
        chrome.storage.session.set({ [STORAGE_KEY]: messages }, () => {
            if (chrome.runtime.lastError) {
                console.error('[Ghost-Reader] Storage error:', chrome.runtime.lastError);
            } else {
                console.log(`[Ghost-Reader] ✅ Saved ${messages.length} messages to storage`);
                console.log('[Ghost-Reader] Latest:', messages[messages.length - 1]?.text.substring(0, 50) + '...');
            }
        });

    } catch (error) {
        console.error('[Ghost-Reader] Error in updateBuffer:', error);
    }
};

/**
 * MutationObserver - watches for new messages
 */
const observer = new MutationObserver((mutations) => {
    // Check if any mutation added nodes
    const hasNewNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
    
    if (hasNewNodes) {
        // Debounce: wait a bit for DOM to settle
        clearTimeout((window as any)._ghostReaderTimeout);
        (window as any)._ghostReaderTimeout = setTimeout(updateBuffer, 100);
    }
});

/**
 * Initialize the Ghost-Reader
 */
const initGhostReader = () => {
    console.log("╔════════════════════════════════════════╗");
    console.log("║   Order Sync: Ghost-Reader v1.0       ║");
    console.log("║   Bottom-Up Build: Content Script     ║");
    console.log("╚════════════════════════════════════════╝");
    console.log("[Ghost-Reader] Initializing on:", window.location.href);

    // Verify chrome APIs are available
    if (typeof chrome === 'undefined' || !chrome.storage) {
        console.error('[Ghost-Reader] ❌ Chrome APIs not available!');
        return;
    }

    // Start observing the entire document body
    const targetNode = document.body;
    const config = { 
        childList: true, 
        subtree: true,
        characterData: true,
        characterDataOldValue: false
    };

    try {
        observer.observe(targetNode, config);
        console.log('[Ghost-Reader] ✅ MutationObserver started');
    } catch (e) {
        console.error('[Ghost-Reader] ❌ Failed to start observer:', e);
        return;
    }

    // Initial scrape after a short delay (let Messenger load)
    setTimeout(() => {
        console.log('[Ghost-Reader] Running initial scrape...');
        updateBuffer();
    }, 2000);

    // Periodically update to catch any missed messages
    setInterval(updateBuffer, 5000);
};

/**
 * Handle messages from popup/background
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getMessages') {
        chrome.storage.session.get([STORAGE_KEY], (data) => {
            sendResponse({ messages: data[STORAGE_KEY] || [] });
        });
        return true; // Keep channel open for async
    }
    
    if (request.action === 'forceUpdate') {
        updateBuffer();
        sendResponse({ status: 'updated' });
    }
});

// Start on window load
if (document.readyState === 'loading') {
    window.addEventListener('load', initGhostReader);
} else {
    // DOM already loaded
    initGhostReader();
}

// Also re-initialize on URL changes (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('[Ghost-Reader] URL changed, reinitializing...');
        setTimeout(initGhostReader, 1000);
    }
}).observe(document, { subtree: true, childList: true });

console.log('[Ghost-Reader] Script loaded, waiting for window.load...');
