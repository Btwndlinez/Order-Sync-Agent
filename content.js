/**
 * Order Sync Agent - Smart Composer (Phase 2)
 * Injects a 🚀 button into Messenger's composer area
 * Manual trigger for conversation analysis
 * 
 * Phase 2 Features:
 * - 🚀 Button injection into Messenger composer
 * - Manual trigger (on-demand analysis)
 * - Grabs last 15 messages
 * - Stores in chrome.storage.local
 * - Prepares data for Edge Function analysis
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        MESSAGES_TO_CAPTURE: 15,
        STORAGE_KEY: 'antigravity_lastConversation',
        BUTTON_EMOJI: '🚀',
        BUTTON_TITLE: 'Analyze conversation & generate checkout',
        DEBUG: true
    };

    // State
    let isButtonInjected = false;
    let observer = null;

    /**
     * Logger utility
     */
    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[Antigravity Smart Composer]', ...args);
        }
    }

    function error(...args) {
        console.error('[Antigravity Smart Composer]', ...args);
    }

    /**
     * Find the Messenger composer input area
     * Messenger uses various selectors - we try multiple fallbacks
     */
    function findComposerArea() {
        const selectors = [
            // Primary: Modern Messenger composer
            '[role="textbox"][contenteditable="true"]',
            // Alternative: Different aria labels
            '[aria-label="Type a message..."]',
            '[aria-label="Message"]',
            // Fallback: Common composer containers
            '[data-testid="composer_container"]',
            // Legacy: Older Messenger versions
            '.xu06os2',  // Common Messenger class
            '[class*="composer"]',
            // Very broad fallback
            'div[contenteditable="true"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                log('Found composer with selector:', selector);
                return element;
            }
        }

        return null;
    }

    /**
     * Find the composer toolbar/action area (where we'll inject our button)
     */
    function findComposerToolbar() {
        const selectors = [
            // Modern Messenger toolbar
            '[data-testid="composer_toolbar"]',
            // Alternative: Parent of textbox
            '[role="textbox"][contenteditable="true"]',
            // Action buttons container
            '[data-testid="composer_actions"]',
            // Fallback: Look for send button
            'button[aria-label="Send"]',
            'button[type="submit"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                // If we found the textbox itself, get its parent toolbar
                if (selector.includes('textbox')) {
                    return element.closest('[role="toolbar"]') || 
                           element.parentElement?.parentElement;
                }
                return element;
            }
        }

        return null;
    }

    /**
     * Find message bubbles in the conversation
     */
    function findMessages() {
        const selectors = [
            // Primary: Modern Messenger
            '[role="presentation"] [dir="auto"]',
            // Alternative test IDs
            '[data-testid="message_text"]',
            // Class-based
            'div[dir="auto"][class*="message"]',
            // Legacy
            '[data-scope="messages_table"] span',
            // Very broad
            '[class*="message"]'
        ];

        for (const selector of selectors) {
            const nodes = document.querySelectorAll(selector);
            if (nodes.length > 0) {
                log(`Found ${nodes.length} messages with selector:`, selector);
                return Array.from(nodes);
            }
        }

        return [];
    }

    /**
     * Determine if a message is from the seller (outgoing)
     */
    function isSellerMessage(node) {
        const sellerSelectors = [
            '[data-testid="outgoing_message"]',
            '.__fb-dark-mode',
            '[class*="outgoing"]',
            '[class*="sent"]'
        ];

        for (const selector of sellerSelectors) {
            try {
                if (node.closest(selector)) {
                    return true;
                }
            } catch (e) {
                // Ignore invalid selectors
            }
        }

        // Alternative: Check if message is on the right side (outgoing)
        const rect = node.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        if (rect.left > viewportWidth / 2) {
            return true;
        }

        return false;
    }

    /**
     * Extract text from a message node
     */
    function extractText(node) {
        const text = node.innerText || node.textContent || '';
        return text.trim();
    }

    /**
     * Capture the last N messages from conversation
     */
    function captureMessages() {
        log('Capturing messages...');

        const messageNodes = findMessages();
        
        if (messageNodes.length === 0) {
            error('No messages found in conversation');
            return null;
        }

        // Get last N messages
        const messages = messageNodes
            .slice(-CONFIG.MESSAGES_TO_CAPTURE)
            .map((node, index) => ({
                text: extractText(node),
                isSeller: isSellerMessage(node),
                timestamp: Date.now() - (messageNodes.length - index) * 1000,
                index: index
            }))
            .filter(msg => msg.text.length > 0);

        log(`Captured ${messages.length} messages`);
        
        if (messages.length > 0) {
            log('Latest message:', messages[messages.length - 1].text.substring(0, 50) + '...');
        }

        return messages;
    }

    /**
     * Store messages in chrome.storage.local
     */
    function storeMessages(messages) {
        return new Promise((resolve, reject) => {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                error('Chrome storage API not available');
                reject(new Error('Storage API unavailable'));
                return;
            }

            const data = {
                [CONFIG.STORAGE_KEY]: messages,
                captureTimestamp: Date.now(),
                messageCount: messages.length
            };

            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    error('Storage error:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    log('✅ Messages stored successfully');
                    resolve(data);
                }
            });
        });
    }

    /**
     * Handle button click - capture and store messages
     */
    async function handleRocketClick(event) {
        event.preventDefault();
        event.stopPropagation();

        log('🚀 Rocket button clicked!');

        // Visual feedback
        const button = event.currentTarget;
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);

        try {
            // Capture messages
            const messages = captureMessages();
            
            if (!messages || messages.length === 0) {
                alert('No messages found. Make sure you\'re in an active conversation.');
                return;
            }

            // Store them
            await storeMessages(messages);

            // Show success notification
            showNotification(`✅ Captured ${messages.length} messages! Open the extension to analyze.`);

            // Optional: Open popup automatically
            // chrome.runtime.sendMessage({ action: 'openPopup' });

        } catch (err) {
            error('Failed to capture messages:', err);
            alert('Error capturing messages. Check console for details.');
        }
    }

    /**
     * Show temporary notification
     */
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #1877f2;
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
     * Create the rocket button
     */
    function createRocketButton() {
        const button = document.createElement('button');
        button.innerHTML = CONFIG.BUTTON_EMOJI;
        button.title = CONFIG.BUTTON_TITLE;
        button.style.cssText = `
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
            margin: 0 4px;
            border-radius: 50%;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
        `;

        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            button.style.transform = 'scale(1.1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('click', handleRocketClick);

        return button;
    }

    /**
     * Inject the rocket button into composer
     */
    function injectButton() {
        if (isButtonInjected) {
            return;
        }

        const composer = findComposerArea();
        if (!composer) {
            log('Composer not found yet, retrying...');
            return false;
        }

        // Find toolbar or create injection point
        let toolbar = findComposerToolbar();
        
        if (!toolbar) {
            // Try to find parent container
            toolbar = composer.closest('div[role="region"]') || 
                     composer.parentElement?.parentElement;
        }

        if (!toolbar) {
            log('Toolbar not found, will retry...');
            return false;
        }

        // Create and inject button
        const button = createRocketButton();
        
        // Try to find a good insertion point
        const actionButtons = toolbar.querySelectorAll('button, [role="button"]');
        
        if (actionButtons.length > 0) {
            // Insert before the last button (usually send)
            const lastButton = actionButtons[actionButtons.length - 1];
            lastButton.parentNode.insertBefore(button, lastButton);
        } else {
            // Fallback: append to toolbar
            toolbar.appendChild(button);
        }

        isButtonInjected = true;
        log('🚀 Rocket button injected successfully!');
        
        return true;
    }

    /**
     * Watch for DOM changes to inject button when composer appears
     */
    function watchForComposer() {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver((mutations) => {
            // Try to inject button if not already done
            if (!isButtonInjected) {
                injectButton();
            }

            // Check if composer was removed (conversation changed)
            const composer = findComposerArea();
            if (!composer && isButtonInjected) {
                log('Composer removed, will re-inject on next conversation');
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
     * Initialize the Smart Composer
     */
    function init() {
        log('╔════════════════════════════════════════╗');
        log('║  Antigravity Smart Composer (Phase 2)  ║');
        log('║  Manual trigger via 🚀 button          ║');
        log('╚════════════════════════════════════════╝');

        // Initial injection attempt
        setTimeout(() => {
            injectButton();
        }, 2000);

        // Watch for composer
        watchForComposer();

        // Listen for messages from popup/background
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === 'getMessages') {
                    chrome.storage.local.get([CONFIG.STORAGE_KEY], (data) => {
                        sendResponse({ 
                            messages: data[CONFIG.STORAGE_KEY] || [],
                            timestamp: data.captureTimestamp 
                        });
                    });
                    return true;
                }

                if (request.action === 'forceCapture') {
                    const messages = captureMessages();
                    storeMessages(messages).then(() => {
                        sendResponse({ success: true, count: messages.length });
                    }).catch(err => {
                        sendResponse({ success: false, error: err.message });
                    });
                    return true;
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
            setTimeout(init, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

})();
