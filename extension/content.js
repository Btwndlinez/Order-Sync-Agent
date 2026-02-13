/**
 * Antigravity Content Script - Order Sync Agent Revenue Wedge with Tiered Pricing
 * 
 * Order Sync Agent Revenue Wedge Workflow:
 * 1. User clicks 🚀 button in Messenger toolbar
 * 2. Scrape conversation messages
 * 3. Send to Supabase Edge Function: analyze-and-match
 * 4. Get variant_id and price from Vector Search
 * 5. Call Stripe to create checkout.session
 * 6. Insert checkout URL into Messenger input field
 * 7. Handle usage limits and upgrade prompts
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        MESSAGES_TO_CAPTURE: 15,
        STORAGE_KEY: 'antigravity_conversation',
        BUTTON_ID: 'antigravity-sync-btn',
        DEBUG: true,
        DEBOUNCE_MS: 500,
        MAX_OBSERVE_TIME: 30000,
        SUPABASE_URL: 'https://your-project.supabase.co',
        SUPABASE_ANON_KEY: 'your-anon-key',
        SELLER_ID: 'default_seller',
    };

    // State
    let isButtonInjected = false;
    let observer = null;
    let debounceTimer = null;
    let observeStartTime = null;

    function log(...args) {
        if (CONFIG.DEBUG) console.log('[Order Sync Agent]', ...args);
    }

    /**
     * Find composer using HIGH-RESILIENCE accessibility anchors
     */
    function findComposerInput() {
        const ariaSelectors = [
            '[aria-label="Message"]',
            '[aria-label="Type a message..."]',
            '[aria-placeholder*="message"]',
        ];

        for (const selector of ariaSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                log('Found composer via ARIA:', selector);
                return el;
            }
        }

        const roleSelectors = [
            '[role="textbox"]',
            '[role="searchbox"]'
        ];

        for (const selector of roleSelectors) {
            const els = document.querySelectorAll(selector);
            for (const el of els) {
                if (el.isContentEditable && el.offsetParent !== null) {
                    log('Found composer via ARIA role:', selector);
                    return el;
                }
            }
        }

        const el = document.querySelector('[contenteditable="true"]');
        if (el && el.offsetParent !== null) {
            const parent = el.closest('form, [role="region"], div');
            if (parent) {
                log('Found composer via contenteditable');
                return el;
            }
        }

        return null;
    }

    /**
     * Find toolbar by traversing from composer input
     */
    function findToolbarFromComposer(composer) {
        if (!composer) return null;

        let parent = composer.parentElement;
        let depth = 0;
        const maxDepth = 5;

        while (parent && depth < maxDepth) {
            const toolbar = parent.querySelector('[role="toolbar"]');
            if (toolbar) {
                log('Found toolbar via ancestor traversal');
                return toolbar;
            }

            const buttons = parent.querySelectorAll('button, [role="button"]');
            const hasSendButton = Array.from(buttons).some(btn => 
                btn.getAttribute('aria-label')?.toLowerCase().includes('send') ||
                btn.type === 'submit'
            );

            if (hasSendButton && buttons.length > 0) {
                log('Found toolbar via button detection');
                return parent;
            }

            parent = parent.parentElement;
            depth++;
        }

        const sendButton = document.querySelector('button[aria-label="Send"], button[type="submit"]');
        if (sendButton) {
            const container = sendButton.closest('div');
            if (container) {
                log('Found toolbar via Send button');
                return container;
            }
        }

        return null;
    }

    /**
     * Find message containers
     */
    function findMessages() {
        const messages = document.querySelectorAll('[role="listitem"]');
        if (messages.length > 0) {
            const messageItems = Array.from(messages).filter(el => {
                return el.textContent.trim().length > 0;
            });
            if (messageItems.length > 0) return messageItems;
        }

        const dataSelectors = [
            '[data-testid="message_container"]',
            '[data-testid="message_text"]'
        ];

        for (const selector of dataSelectors) {
            const nodes = document.querySelectorAll(selector);
            if (nodes.length > 0) return Array.from(nodes);
        }

        const textNodes = document.querySelectorAll('div[dir="auto"]');
        if (textNodes.length > 10) {
            return Array.from(textNodes).filter(el => 
                el.textContent.trim().length > 0 &&
                el.children.length <= 2
            );
        }

        return [];
    }

    /**
     * Determine message role
     */
    function getMessageRole(node) {
        const isOutgoing = 
            node.closest('[data-testid="outgoing_message"]') !== null ||
            node.getAttribute('data-testid')?.includes('outgoing') ||
            node.className?.includes('outgoing');

        if (isOutgoing) return 'assistant';

        const rect = node.getBoundingClientRect();
        if (rect.left > window.innerWidth * 0.5) {
            return 'assistant';
        }

        return 'user';
    }

    /**
     * Extract message text
     */
    function extractMessageText(node) {
        const text = node.innerText?.trim() || node.textContent?.trim() || '';
        return text.replace(/\s+/g, ' ').trim();
    }

    /**
     * Capture messages
     */
    function captureMessages() {
        const nodes = findMessages();
        if (nodes.length === 0) return null;

        log(`Found ${nodes.length} raw message nodes`);

        const messages = nodes
            .slice(-CONFIG.MESSAGES_TO_CAPTURE)
            .map(node => {
                const text = extractMessageText(node);
                if (!text) return null;

                return {
                    role: getMessageRole(node),
                    content: text,
                    timestamp: Date.now()
                };
            })
            .filter(msg => msg !== null && msg.content.length > 0);

        log(`Captured ${messages.length} valid messages`);
        return messages;
    }

    /**
     * Call analyze-and-match Edge Function
     */
    async function callAnalyzeAndMatch(messages) {
        const url = `${CONFIG.SUPABASE_URL}/functions/v1/analyze-and-match`;
        
        const messengerId = window.location.href.match(/\/t\/(\d+)/)?.[1] || null;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                messages: messages,
                seller_id: CONFIG.SELLER_ID,
                messenger_id: messengerId,
                safety_settings: {
                    HARM_CATEGORY_HARASSMENT: 'BLOCK_NONE',
                    HARM_CATEGORY_HARASSMENT_THREAT: 'BLOCK_NONE',
                    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'BLOCK_NONE',
                    HARM_CATEGORY_DANGEROUS_CONTENT: 'BLOCK_NONE',
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`analyze-and-match failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        log('analyze-and-match response:', data);
        
        if (!data.success || !data.checkout_ready) {
            throw new Error(`No product match found: ${data.product_title || 'unknown'}`);
        }

        return data;
    }

    /**
     * Call create-checkout Edge Function with usage gate
     */
    async function callCreateCheckout(variantId, price, quantity, productTitle) {
        const url = `${CONFIG.SUPABASE_URL}/functions/v1/create-checkout`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                variant_id: variantId,
                price: price,
                quantity: quantity || 1,
                product_title: productTitle,
                seller_id: CONFIG.SELLER_ID,
                success_url: window.location.href,
                cancel_url: window.location.href,
            }),
        });

        const data = await response.json();
        log('create-checkout response:', data);

        // Handle 403 - Usage limit reached
        if (response.status === 403) {
            const error = new Error(data.message || 'Usage limit reached');
            error.name = 'UsageLimitError';
            error.status = 403;
            error.data = data;
            throw error;
        }

        if (!response.ok) {
            throw new Error(`create-checkout failed: ${data.error || response.statusText}`);
        }

        if (!data.success) {
            throw new Error(`Checkout creation failed: ${data.error}`);
        }

        return data;
    }

    /**
     * Insert text into Messenger input field
     */
    function insertIntoInputField(text) {
        const composer = findComposerInput();
        if (!composer) {
            log('Could not find input field to insert checkout URL');
            return false;
        }

        if (composer.isContentEditable) {
            composer.focus();
            composer.innerText = text;
            
            const inputEvent = new Event('input', { bubbles: true });
            composer.dispatchEvent(inputEvent);
            
            const changeEvent = new Event('change', { bubbles: true });
            composer.dispatchEvent(changeEvent);
            
            log('Inserted checkout URL into input field');
            return true;
        }

        if (composer.tagName === 'TEXTAREA' || composer.tagName === 'INPUT') {
            composer.focus();
            composer.value = text;
            composer.dispatchEvent(new Event('input', { bubbles: true }));
            composer.dispatchEvent(new Event('change', { bubbles: true }));
            log('Inserted checkout URL into input field');
            return true;
        }

        composer.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
        log('Inserted checkout URL using execCommand');
        return true;
    }

    /**
     * Show upgrade modal when limit reached
     */
    function showUpgradeModal(data) {
        // Remove existing modals
        const existing = document.querySelector('.ordersync-upgrade-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'ordersync-upgrade-modal';
        
        const currentPlan = data.current_plan || 'starter';
        const used = data.used || 20;
        const tierInfo = data.tier_info || {
            starter: { limit: 20, price: 19 },
            pro: { limit: 200, price: 49 },
            scale: { limit: 1000, price: 149 }
        };

        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 420px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    animation: modalSlideIn 0.3s ease;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
                    <h2 style="
                        margin: 0 0 8px 0;
                        font-size: 24px;
                        font-weight: 700;
                        color: #1a1a2e;
                    ">Goal Reached!</h2>
                    <p style="
                        margin: 0 0 24px 0;
                        font-size: 16px;
                        color: #666;
                        line-height: 1.5;
                    ">
                        You've generated ${used} links this month. Ready to scale to ${tierInfo.pro.limit}?
                    </p>
                    
                    <div style="
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 24px;
                        text-align: left;
                    ">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                            <span style="color: #666;">Current Plan</span>
                            <span style="font-weight: 600; text-transform: capitalize;">${currentPlan}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                            <span style="color: #666;">Links Used</span>
                            <span style="font-weight: 600;">${used} / ${tierInfo[currentPlan].limit}</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                            <div style="
                                width: 100%;
                                height: 100%;
                                background: linear-gradient(90deg, #ff6b6b, #ee5a6f);
                                border-radius: 4px;
                            "></div>
                        </div>
                    </div>

                    <div style="display: grid; gap: 12px;">
                        <button id="ordersync-upgrade-pro" style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            padding: 14px 24px;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: transform 0.2s;
                        ">
                            Upgrade to Pro - $49/mo
                            <div style="font-size: 12px; font-weight: 400; opacity: 0.9; margin-top: 4px;">
                                200 links/month
                            </div>
                        </button>
                        
                        <button id="ordersync-upgrade-scale" style="
                            background: white;
                            color: #667eea;
                            border: 2px solid #667eea;
                            padding: 14px 24px;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">
                            Go Scale - $149/mo
                            <div style="font-size: 12px; font-weight: 400; margin-top: 4px;">
                                1000 links/month + Priority Support
                            </div>
                        </button>

                        <button id="ordersync-close-modal" style="
                            background: transparent;
                            color: #999;
                            border: none;
                            padding: 12px;
                            font-size: 14px;
                            cursor: pointer;
                            margin-top: 8px;
                        ">
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add animation styles
        if (!document.getElementById('ordersync-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'ordersync-modal-styles';
            styles.textContent = `
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(modal);

        // Event handlers
        modal.querySelector('#ordersync-upgrade-pro').addEventListener('click', () => {
            window.open('https://ordersync.app/upgrade?plan=pro', '_blank');
            modal.remove();
        });

        modal.querySelector('#ordersync-upgrade-scale').addEventListener('click', () => {
            window.open('https://ordersync.app/upgrade?plan=scale', '_blank');
            modal.remove();
        });

        modal.querySelector('#ordersync-close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal.firstElementChild) {
                modal.remove();
            }
        });
    }

    /**
     * Show usage warning notification
     */
    function showUsageWarning(usage) {
        const el = document.createElement('div');
        el.className = 'ordersync-usage-warning';
        el.style.cssText = `
            position: fixed;
            bottom: 140px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            font-weight: 500;
            z-index: 2147483646;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideUp 0.3s ease;
            max-width: 90%;
        `;
        el.innerHTML = `
            <span>⚠️</span>
            <span>Only ${usage.remaining} links left this month! <a href="https://ordersync.app/upgrade" target="_blank" style="color: white; text-decoration: underline; font-weight: 600;">Upgrade now</a></span>
        `;
        document.body.appendChild(el);
        
        setTimeout(() => {
            el.style.animation = 'slideDown 0.3s ease forwards';
            setTimeout(() => el.remove(), 300);
        }, 8000);
    }

    /**
     * Order Sync Agent Revenue Wedge - onSyncClick Handler
     */
    async function onSyncClick(event) {
        event.preventDefault();
        event.stopPropagation();

        const btn = event.currentTarget;
        btn.style.transform = 'scale(0.9)';
        btn.style.opacity = '0.7';

        chrome.runtime.sendMessage({ action: 'setSyncing' });
        showNotification('🔄 Analyzing conversation...');

        try {
            // 1. SCRAPE: Capture messages
            const messages = captureMessages();
            
            if (!messages || messages.length === 0) {
                showNotification('❌ No messages found in conversation');
                chrome.runtime.sendMessage({ action: 'setError' });
                return;
            }

            log(`📝 Scraped ${messages.length} messages`);

            // 2. MATCH: Call analyze-and-match
            showNotification('🔍 Matching products...');
            const matchResult = await callAnalyzeAndMatch(messages);
            
            if (!matchResult.variant_id) {
                showNotification('❌ No product match found in conversation');
                chrome.runtime.sendMessage({ action: 'setError' });
                return;
            }

            log(`✅ Matched product: ${matchResult.product_title}`);
            showNotification(`✅ Matched: ${matchResult.product_title}`);

            // 3. CHECKOUT: Create Stripe session
            showNotification('💳 Generating checkout...');
            const checkoutResult = await callCreateCheckout(
                matchResult.variant_id,
                matchResult.price,
                matchResult.quantity,
                matchResult.product_title
            );

            log(`✅ Checkout URL: ${checkoutResult.checkout_url}`);

            // Show usage warning if nearly at limit
            if (checkoutResult.usage && checkoutResult.usage.nearly_full) {
                showUsageWarning(checkoutResult.usage);
            }

            // 4. DELIVER: Insert checkout URL
            const inserted = insertIntoInputField(checkoutResult.checkout_url);
            
            if (inserted) {
                showNotification(`✅ Checkout ready! (${checkoutResult.usage?.remaining || '?'} links left)`);
                chrome.runtime.sendMessage({ 
                    action: 'checkoutReady',
                    product: matchResult.product_title,
                    amount: checkoutResult.total_amount,
                    usage: checkoutResult.usage
                });
            } else {
                await navigator.clipboard.writeText(checkoutResult.checkout_url);
                showNotification('✅ Checkout link copied to clipboard!');
            }

            // Store for popup
            await chrome.storage.session.set({
                [CONFIG.STORAGE_KEY]: {
                    messages: messages,
                    match: matchResult,
                    checkout: checkoutResult,
                    usage: checkoutResult.usage,
                    url: window.location.href,
                    messengerId: window.location.href.match(/\/t\/(\d+)/)?.[1] || null,
                    timestamp: Date.now(),
                }
            });

        } catch (err) {
            console.error('[Order Sync Agent] Revenue Wedge error:', err);
            
            // Handle usage limit error specially
            if (err.status === 403 || err.name === 'UsageLimitError') {
                showNotification('🎯 Goal Reached! Upgrade to send more links');
                if (err.data) {
                    showUpgradeModal(err.data);
                }
                chrome.runtime.sendMessage({ 
                    action: 'limitReached',
                    error: err.message,
                    data: err.data
                });
            } else {
                showNotification(`❌ ${err.message}`);
                chrome.runtime.sendMessage({ action: 'setError' });
            }
        } finally {
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
                btn.style.opacity = '1';
            }, 200);
        }
    }

    /**
     * Show temporary notification
     */
    function showNotification(text) {
        const existing = document.querySelector('.ordersync-notification');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'ordersync-notification';
        el.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            z-index: 2147483647;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
            max-width: 90%;
            text-align: center;
        `;
        el.textContent = text;
        document.body.appendChild(el);
        
        setTimeout(() => {
            el.style.animation = 'slideDown 0.3s ease forwards';
            setTimeout(() => el.remove(), 300);
        }, 4000);
    }

    /**
     * Create 🚀 button
     */
    function createButton() {
        const btn = document.createElement('button');
        btn.id = CONFIG.BUTTON_ID;
        btn.innerHTML = '🚀';
        btn.title = 'Generate checkout link from conversation';
        btn.setAttribute('aria-label', 'Generate checkout');
        btn.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
            font-size: 18px !important;
            cursor: pointer !important;
            padding: 6px !important;
            margin: 0 4px !important;
            border-radius: 50% !important;
            width: 32px !important;
            height: 32px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
            z-index: 2147483647 !important;
            position: relative !important;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        });

        btn.addEventListener('click', onSyncClick);

        return btn;
    }

    /**
     * Inject button into toolbar
     */
    function injectButton() {
        if (isButtonInjected || document.getElementById(CONFIG.BUTTON_ID)) {
            return true;
        }

        const composer = findComposerInput();
        if (!composer) {
            log('Composer not found, will retry...');
            return false;
        }

        const toolbar = findToolbarFromComposer(composer);
        if (!toolbar) {
            log('Toolbar not found, will retry...');
            return false;
        }

        const button = createButton();
        
        const sendBtn = toolbar.querySelector('button[aria-label="Send"], button[type="submit"]');
        if (sendBtn && sendBtn.parentNode === toolbar) {
            toolbar.insertBefore(button, sendBtn);
        } else {
            toolbar.appendChild(button);
        }

        isButtonInjected = true;
        log('🚀 Order Sync Agent button injected successfully');
        
        if (observer) {
            observer.disconnect();
            log('Observer disconnected to save CPU');
        }
        
        return true;
    }

    /**
     * PERFORMANCE: Debounced observer callback
     */
    function debouncedObserve() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            if (!isButtonInjected) {
                injectButton();
            }

            if (observeStartTime && Date.now() - observeStartTime > CONFIG.MAX_OBSERVE_TIME) {
                if (observer) {
                    observer.disconnect();
                    log('Observer stopped after max time');
                }
            }
        }, CONFIG.DEBOUNCE_MS);
    }

    /**
     * Initialize observer
     */
    function initObserver() {
        if (observer) {
            observer.disconnect();
        }

        observeStartTime = Date.now();

        observer = new MutationObserver((mutations) => {
            if (!isButtonInjected) {
                debouncedObserve();
            }
        });

        let target = document.querySelector('[role="main"]') || 
                     document.querySelector('main') ||
                     document.body;

        observer.observe(target, {
            childList: true,
            subtree: true
        });

        log('Observer started (debounced, max 30s)');
    }

    /**
     * Initialize
     */
    function init() {
        log('╔════════════════════════════════════════╗');
        log('║   Order Sync Agent Revenue Wedge              ║');
        log('║   One-Click Checkout Generation        ║');
        log('║   Tiered Pricing Enabled               ║');
        log('╚════════════════════════════════════════╝');

        setTimeout(() => {
            injectButton();
        }, 1000);

        initObserver();

        chrome.runtime.onMessage?.addListener((req, sender, sendResponse) => {
            if (req.action === 'getMessages') {
                chrome.storage.session.get([CONFIG.STORAGE_KEY], (data) => {
                    sendResponse(data[CONFIG.STORAGE_KEY] || null);
                });
                return true;
            }
        });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-init on URL changes
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            isButtonInjected = false;
            observeStartTime = null;
            setTimeout(init, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

})();
