/**
 * Order Sync Agent - Extension Phase: Smart Composer
 * Injects a 🚀 Sync button into Messenger's Composer
 * 
 * Target: Find the Messenger Composer (where user types)
 * Action: Inject 🚀 button with click handler
 * Data: Scrape last 15 messages, save to chrome.storage.local
 * Feedback: Trigger pulse animation on extension icon
 * 
 * Data Fields for Vector Search (matching sync-products.ts):
 * - messages: text, isSeller, timestamp
 * - context: seller_id, messenger_id, conversation_context
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        MESSAGES_TO_CAPTURE: 15,
        STORAGE_KEY_MESSAGES: 'antigravity_messages',
        STORAGE_KEY_CONTEXT: 'antigravity_context',
        BUTTON_ID: 'antigravity-sync-btn',
        DEBUG: true
    };

    // State
    let isButtonInjected = false;
    let pulseInterval = null;

    /**
     * Logger utility
     */
    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[Antigravity Sync]', ...args);
        }
    }

    function error(...args) {
        console.error('[Antigravity Sync]', ...args);
    }

    /**
     * Find the Messenger Composer input area
     * Multiple selectors to handle different Messenger versions
     */
    function findComposer() {
        const selectors = [
            // Modern Messenger - text input
            '[role="textbox"][contenteditable="true"]',
            '[aria-label="Type a message..."]',
            '[aria-label="Message"]',
            '[data-testid="mw_text_input"]',
            // Composer container
            '[data-testid="composer_container"]',
            '[data-testid="mw_composer"]',
            // Legacy selectors
            '.xu06os2',
            '[class*="composer"] input',
            '[class*="composer"] [contenteditable]'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                log('Found composer with selector:', selector);
                return el;
            }
        }

        return null;
    }

    /**
     * Find the composer toolbar/action area
     * This is where we inject our 🚀 button
     */
    function findComposerToolbar() {
        const selectors = [
            // Modern Messenger toolbar
            '[data-testid="composer_toolbar"]',
            '[data-testid="mw_composer_toolbar"]',
            // Action buttons container
            '[data-testid="composer_actions"]',
            // Parent of send button
            'button[aria-label="Send"]', 
            'button[type="submit"]'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                // If we found a button, get its parent container
                if (el.tagName === 'BUTTON') {
                    return el.closest('[role="toolbar"]') || 
                           el.parentElement?.parentElement ||
                           el.parentElement;
                }
                return el;
            }
        }

        // Fallback: Try to find near the composer
        const composer = findComposer();
        if (composer) {
            return composer.closest('div[role="region"]') || 
                   composer.parentElement?.parentElement;
        }

        return null;
    }

    /**
     * Find message bubbles in the conversation
     * Returns array of message elements
     */
    function findMessages() {
        const selectors = [
            // Primary: Modern Messenger message bubbles
            '[data-testid="message_container"]',
            '[role="presentation"] [dir="auto"]',
            // Alternative selectors
            '[data-testid="message_text"]',
            'div[dir="auto"][class*="message"]',
            '[data-scope="messages_table"] div',
            // Broad fallback
            '[class*="message"] div[dir="auto"]'
        ];

        for (const selector of selectors) {
            const nodes = document.querySelectorAll(selector);
            if (nodes.length > 0) {
                log(`Found ${nodes.length} message nodes with: ${selector}`);
                return Array.from(nodes);
            }
        }

        log('No message nodes found');
        return [];
    }

    /**
     * Determine if message is from seller (outgoing)
     */
    function isSellerMessage(node) {
        // Check for outgoing message indicators
        const sellerSelectors = [
            '[data-testid="outgoing_message"]',
            '[data-testid="message_container"][class*="outgoing"]',
            '.__fb-dark-mode',
            '[class*="sent"]',
            '[class*="outgoing"]'
        ];

        for (const selector of sellerSelectors) {
            try {
                if (node.closest(selector)) return true;
            } catch (e) {}
        }

        // Alternative: Check position (outgoing usually right-aligned)
        const rect = node.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        if (rect.left > viewportWidth * 0.4) {
            return true;
        }

        return false;
    }

    /**
     * Extract text from message node
     */
    function extractText(node) {
        return (node.innerText || node.textContent || '').trim();
    }

    /**
     * Scrape conversation metadata for Vector Search context
     * Matches fields used in sync-products.ts
     */
    function scrapeConversationContext() {
        const context = {
            url: window.location.href,
            messenger_id: null,
            participant_count: 0,
            conversation_title: null,
            timestamp: Date.now()
        };

        // Try to extract conversation ID from URL
        // Format: https://www.messenger.com/t/{conversation_id}
        const urlMatch = window.location.href.match(/\/t\/(\d+)/);
        if (urlMatch) {
            context.messenger_id = urlMatch[1];
        }

        // Try to get conversation title
        const titleSelectors = [
            '[data-testid="conversation_title"]',
            'h2[role="heading"]',
            '[class*="conversation"] h1',
            '[class*="title"]'
        ];

        for (const selector of titleSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                context.conversation_title = el.textContent?.trim();
                break;
            }
        }

        // Count visible messages as proxy for participant activity
        const messages = findMessages();
        context.participant_count = messages.length;

        return context;
    }

    /**
     * Capture last N messages with full data for Vector Search
     */
    function captureMessages() {
        log('Capturing messages for Vector Search...');

        const messageNodes = findMessages();
        
        if (messageNodes.length === 0) {
            error('No messages found in conversation');
            return null;
        }

        // Get last N messages
        const messages = messageNodes
            .slice(-CONFIG.MESSAGES_TO_CAPTURE)
            .map((node, index) => {
                const text = extractText(node);
                const isSeller = isSellerMessage(node);
                
                // Create message object matching Vector Search needs
                return {
                    id: `msg_${index}`,
                    text: text,
                    isSeller: isSeller,
                    role: isSeller ? 'seller' : 'buyer',
                    timestamp: Date.now() - (messageNodes.length - index) * 1000,
                    // Additional fields for context
                    messageType: text.length > 0 ? 'text' : 'other',
                    wordCount: text.split(/\s+/).filter(w => w.length > 0).length
                };
            })
            .filter(msg => msg.text.length > 0);

        log(`Captured ${messages.length} messages`);
        
        if (messages.length > 0) {
            log('Latest:', messages[messages.length - 1].text.substring(0, 50) + '...');
        }

        return messages;
    }

    /**
     * Store messages and context to chrome.storage.local
     * Structured for Vector Search compatibility
     */
    async function storeMessages(messages, context) {
        return new Promise((resolve, reject) => {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                reject(new Error('Chrome storage API not available'));
                return;
            }

            const data = {
                [CONFIG.STORAGE_KEY_MESSAGES]: messages,
                [CONFIG.STORAGE_KEY_CONTEXT]: context,
                captureTimestamp: Date.now(),
                messageCount: messages.length,
                // Additional metadata for Edge Function
                vectorSearchReady: true,
                dataVersion: '1.0'
            };

            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    error('Storage error:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    log('✅ Messages stored to chrome.storage.local');
                    log('   Count:', messages.length);
                    log('   Context:', context.messenger_id || 'unknown');
                    resolve(data);
                }
            });
        });
    }

    /**
     * Trigger pulse animation on extension icon
     * Uses chrome.action API
     */
    function triggerPulseAnimation() {
        if (typeof chrome === 'undefined' || !chrome.action) {
            log('Chrome action API not available for pulse');
            return;
        }

        log('🔄 Triggering pulse animation...');

        // Set badge to indicate data ready
        chrome.action.setBadgeText({ text: '●' });
        chrome.action.setBadgeBackgroundColor({ color: '#00c851' });

        // Pulse animation using badge color changes
        let pulseCount = 0;
        const maxPulses = 6;
        
        if (pulseInterval) {
            clearInterval(pulseInterval);
        }

        pulseInterval = setInterval(() => {
            pulseCount++;
            
            // Alternate between bright and dim green
            const color = pulseCount % 2 === 0 ? '#00c851' : '#00ff00';
            chrome.action.setBadgeBackgroundColor({ color: color });

            if (pulseCount >= maxPulses) {
                clearInterval(pulseInterval);
                // Settle on solid green
                chrome.action.setBadgeBackgroundColor({ color: '#00c851' });
                chrome.action.setBadgeText({ text: '●' });
            }
        }, 300);

        // Also send message to background script for advanced animations
        chrome.runtime.sendMessage({ 
            action: 'dataReady', 
            count: CONFIG.MESSAGES_TO_CAPTURE 
        }).catch(() => {});
    }

    /**
     * Clear pulse animation
     */
    function clearPulseAnimation() {
        if (pulseInterval) {
            clearInterval(pulseInterval);
            pulseInterval = null;
        }
        
        if (typeof chrome !== 'undefined' && chrome.action) {
            chrome.action.setBadgeText({ text: '' });
        }
    }

    /**
     * Show notification in UI
     */
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#00c851' : '#ff4444';
        
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColor};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Handle 🚀 button click
     */
    async function handleSyncClick(event) {
        event.preventDefault();
        event.stopPropagation();

        log('🚀 Sync button clicked!');

        const button = event.currentTarget;
        
        // Visual feedback - button press
        button.style.transform = 'scale(0.9)';
        button.style.opacity = '0.7';

        try {
            // Step 1: Scrape conversation context
            const context = scrapeConversationContext();
            log('Context scraped:', context.messenger_id);

            // Step 2: Capture messages
            const messages = captureMessages();
            
            if (!messages || messages.length === 0) {
                showNotification('❌ No messages found', 'error');
                button.style.transform = 'scale(1)';
                button.style.opacity = '1';
                return;
            }

            // Step 3: Store to chrome.storage.local
            await storeMessages(messages, context);

            // Step 4: Trigger pulse animation
            triggerPulseAnimation();

            // Step 5: Show success
            showNotification(`✅ Synced ${messages.length} messages! Ready for analysis.`);

            log('✅ Sync complete - data ready for Vector Search');

        } catch (err) {
            error('Sync failed:', err);
            showNotification('❌ Sync failed: ' + err.message, 'error');
        } finally {
            // Reset button
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.style.opacity = '1';
            }, 200);
        }
    }

    /**
     * Create the 🚀 Sync button
     */
    function createSyncButton() {
        const button = document.createElement('button');
        button.id = CONFIG.BUTTON_ID;
        button.innerHTML = '🚀';
        button.title = 'Sync conversation for analysis';
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 6px;
            margin: 0 4px;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            position: relative;
            overflow: hidden;
        `;

        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        });

        button.addEventListener('click', handleSyncClick);

        return button;
    }

    /**
     * Inject button into composer toolbar
     */
    function injectButton() {
        if (isButtonInjected) return true;

        // Check if button already exists
        if (document.getElementById(CONFIG.BUTTON_ID)) {
            isButtonInjected = true;
            return true;
        }

        const toolbar = findComposerToolbar();
        if (!toolbar) {
            log('Toolbar not found, will retry...');
            return false;
        }

        const button = createSyncButton();

        // Find insertion point - try to insert before send button
        const sendButton = toolbar.querySelector('button[aria-label="Send"], button[type="submit"]');
        
        if (sendButton) {
            toolbar.insertBefore(button, sendButton);
        } else {
            toolbar.appendChild(button);
        }

        isButtonInjected = true;
        log('🚀 Sync button injected successfully!');
        
        return true;
    }

    /**
     * Watch for DOM changes to inject button
     */
    function watchForComposer() {
        const observer = new MutationObserver(() => {
            if (!isButtonInjected) {
                injectButton();
            }

            // Check if composer was removed
            const composer = findComposer();
            if (!composer && isButtonInjected) {
                log('Composer removed, will re-inject');
                isButtonInjected = false;
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        log('👀 Watching for composer...');
    }

    /**
     * Initialize Extension Phase
     */
    function init() {
        log('╔══════════════════════════════════════════════════╗');
        log('║   Order Sync: Extension Phase - Smart Composer  ║');
        log('║   🚀 Sync Button + Vector Search Integration    ║');
        log('╚══════════════════════════════════════════════════╝');
        log('URL:', window.location.href);

        // Inject button after a short delay (let Messenger load)
        setTimeout(() => {
            injectButton();
        }, 1500);

        // Watch for composer
        watchForComposer();

        // Listen for messages from popup/background
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === 'getMessages') {
                    chrome.storage.local.get([
                        CONFIG.STORAGE_KEY_MESSAGES,
                        CONFIG.STORAGE_KEY_CONTEXT
                    ], (data) => {
                        sendResponse({
                            messages: data[CONFIG.STORAGE_KEY_MESSAGES] || [],
                            context: data[CONFIG.STORAGE_KEY_CONTEXT] || {},
                            timestamp: data.captureTimestamp
                        });
                    });
                    return true; // Keep channel open
                }

                if (request.action === 'clearPulse') {
                    clearPulseAnimation();
                    sendResponse({ cleared: true });
                }
            });
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-init on URL changes (SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            log('URL changed, reinitializing...');
            isButtonInjected = false;
            clearPulseAnimation();
            setTimeout(init, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

})();
