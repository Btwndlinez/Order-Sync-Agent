/**
 * OrderSyncAgent Background Service Worker
 * Handles side panel, text capture relay, and analytics
 * Multi-Channel Router for WhatsApp & Messenger adapters
 */

// Enable side panel when extension icon is clicked
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Side panel error:', error));

/**
 * Pending Intent Queue
 * Stores messages that passed intent detection
 */
const PENDING_INTENTS = [];
const MAX_PENDING = 10;

/**
 * Intent Scoring - Lightweight Heuristic Check
 * Returns score 0-100 based on purchase intent indicators
 */
function scoreIntent(text) {
    if (!text || text.length < 10) return 0;
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    // Purchase keywords (max 40 points)
    const purchaseKeywords = [
        'buy', 'take', 'want', 'need', 'order', 'purchase',
        'ship', 'shipping', 'checkout', 'pay', 'cost', 'total'
    ];
    purchaseKeywords.forEach(kw => {
        if (lowerText.includes(kw)) score += 5;
    });
    score = Math.min(score, 40);
    
    // Price indicators (max 30 points)
    if (/\$\d+/.test(text)) score += 20;           // $XX.XX
    if (/\d{2,}/.test(text)) score += 10;         // Numbers
    
    // Quantity indicators (max 20 points)
    if (/\d+\s*(x|pcs|pieces|units)/i.test(text)) score += 15;
    if (/two|three|four|five|half\s*dozen/i.test(text)) score += 10;
    
    // Variant/size/color (max 10 points)
    if (/size|small|medium|large|xl|xxl/i.test(text)) score += 5;
    if (/color|black|white|red|blue|green/i.test(text)) score += 5;
    
    return Math.min(score, 100);
}

/**
 * Add to pending queue and notify side panel
 */
function queuePendingIntent(payload) {
    const intentScore = scoreIntent(payload.text);
    
    if (intentScore < 30) {
        console.log('[Router] Intent score too low:', intentScore, payload.text.substring(0, 30));
        return false;
    }
    
    const pendingItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        ...payload,
        score: intentScore,
        processed: false
    };
    
    PENDING_INTENTS.unshift(pendingItem);
    if (PENDING_INTENTS.length > MAX_PENDING) {
        PENDING_INTENTS.pop();
    }
    
    // Store for side panel access
    chrome.storage.local.set({
        pendingIntents: PENDING_INTENTS.slice(0, 5),
        latestIntent: pendingItem
    });
    
    // Notify side panel
    chrome.runtime.sendMessage({
        type: 'INTENT_DETECTED',
        payload: pendingItem
    }).catch(() => {});
    
    console.log('[Router] Intent queued:', {
        source: payload.source,
        score: intentScore,
        text: payload.text.substring(0, 30)
    });
    
    return true;
}

/**
 * Multi-Channel Message Router
 * Handles messages from whatsapp.js and messenger.js adapters
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle channel messages from adapters
    if (request.type === 'CHANNEL_MESSAGE') {
        const { source, text, timestamp, url } = request.payload;
        
        console.log('[Router] Channel message received:', { source, text: text.substring(0, 30) });
        
        // Queue if intent detected
        const queued = queuePendingIntent({
            source,
            text,
            timestamp,
            url,
            sender: sender.tab?.id
        });
        
        sendResponse({ 
            status: queued ? 'queued' : 'ignored',
            score: scoreIntent(text)
        });
        
        return true;
    }
    
    // Handle CAPTURED_TEXT (existing)
    if (request.action === 'CAPTURED_TEXT') {
        console.log('[OrderSyncAgent Relay] CAPTURED_TEXT received:', {
            text: request.text?.substring(0, 50) + '...',
            source: request.source,
            timestamp: new Date(request.timestamp).toISOString()
        });
        
        chrome.storage.local.set({
            lastCapturedText: request.text,
            captureSource: request.source,
            captureTimestamp: request.timestamp
        });
        
        sendResponse({ status: 'relayed' });
    }
    
    // Handle getPendingIntents
    if (request.action === 'getPendingIntents') {
        sendResponse({ intents: PENDING_INTENTS });
    }
    
    // Handle clearPendingIntent
    if (request.action === 'clearPendingIntent') {
        const index = PENDING_INTENTS.findIndex(i => i.id === request.intentId);
        if (index > -1) {
            PENDING_INTENTS[index].processed = true;
        }
        sendResponse({ status: 'cleared' });
    }
    
    return true;
});

// Configuration - Replace with your PostHog API Key
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || 'phc_your_posthog_api_key'
const POSTHOG_HOST = 'https://app.posthog.com'

// PostHog Client (lightweight initialization)
let posthog = null

async function initPostHog() {
    if (posthog || typeof window !== 'undefined') return

    try {
        const script = document.createElement('script')
        script.src = 'https://js.posthog.com/script.js'
        script.async = true
        document.head.appendChild(script)

        await new Promise((resolve) => {
            script.onload = resolve
        })

        posthog = (window).posthog
        posthog.init(POSTHOG_API_KEY, {
            api_host: POSTHOG_HOST,
            persistence: 'localStorage',
            autocapture: false,
            capture_pageview: false,
            bootstrap: {
                distinctID: await getOrCreateAnonymousId(),
            },
        })
    } catch (error) {
        console.warn('[PostHog] Initialization failed:', error)
    }
}

async function getOrCreateAnonymousId() {
    const result = await chrome.storage.local.get('posthog_anonymous_id')
    if (result.posthog_anonymous_id) {
        return result.posthog_anonymous_id
    }

    const newId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    await chrome.storage.local.set({ posthog_anonymous_id: newId })
    return newId
}

// Privacy-First Event Tracking
// NO message text, buyer PII, or conversation content is ever tracked
const analytics = {
    track: async function(eventName, properties = {}) {
        try {
            const anonymousId = await getOrCreateAnonymousId()

            const sanitizedProperties = sanitizeProperties(properties)

            const payload = {
                api_key: POSTHOG_API_KEY,
                event: eventName,
                distinct_id: anonymousId,
                properties: {
                    ...sanitizedProperties,
                    $browser: 'Chrome Extension',
                    $os: await getOSInfo(),
                    $lib: 'extension-bg',
                    timestamp: new Date().toISOString(),
                },
            }

            await fetch(`${POSTHOG_HOST}/capture`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            console.log(`[PostHog] Event: ${eventName}`, sanitizedProperties)
        } catch (error) {
            console.warn('[PostHog] Track failed:', error)
        }
    },
}

function sanitizeProperties(properties) {
    const blockedKeys = [
        'text', 'message', 'content', 'email', 'name', 'phone',
        'address', 'buyer', 'customer', 'conversation', 'chat',
        'transcript', 'body', 'subject', 'from', 'to',
    ]

    const sanitized = {}
    for (const [key, value] of Object.entries(properties || {})) {
        const lowerKey = key.toLowerCase()
        const isBlocked = blockedKeys.some(blocked => lowerKey.includes(blocked))

        if (!isBlocked && value !== undefined && value !== null) {
            if (typeof value === 'object') {
                sanitized[key] = sanitizeProperties(value)
            } else {
                sanitized[key] = value
            }
        }
    }
    return sanitized
}

async function getOSInfo() {
    return new Promise((resolve) => {
        chrome.runtime.getPlatformInfo((info) => {
            resolve(info.os || 'unknown')
        })
    })
}

// Event Tracking Functions
const events = {
    linkGenerated: (properties) => {
        analytics.track('link_generated', {
            plan_type: properties.plan_type || 'starter',
            usage_count: properties.usage_count,
            variant_id: properties.variant_id,
            product_title: properties.product_title,
            checkout_url_created: true,
        })
    },

    limitReached: (properties) => {
        analytics.track('limit_reached', {
            plan_type: properties.plan_type || 'starter',
            links_used: properties.links_used,
            links_limit: properties.links_limit,
            trigger: properties.trigger || 'checkout_attempt',
        })
    },

    upgradeButtonClicked: (properties) => {
        analytics.track('upgrade_button_clicked', {
            current_plan: properties.current_plan || 'starter',
            suggested_plan: properties.suggested_plan || 'pro',
            usage_percentage: properties.usage_percentage,
            upgrade_source: properties.upgrade_source || 'limit_modal',
        })
    },

    checkoutCreated: (properties) => {
        analytics.track('checkout_created', {
            plan_type: properties.plan_type || 'starter',
            variant_id: properties.variant_id,
            price_cents: properties.price_cents,
            product_title: properties.product_title,
        })
    },

    analyzerRun: (properties) => {
        analytics.track('analyzer_run', {
            plan_type: properties.plan_type || 'starter',
            conversation_length: properties.conversation_length,
            intent_detected: properties.intent_detected,
            confidence_score: properties.confidence_score,
        })
    },

    extensionInstalled: (properties) => {
        analytics.track('extension_installed', {
            version: properties.version || '1.0.0',
            install_date: new Date().toISOString(),
            browser: 'Chrome',
        })
    },
}

// Badge states
const BADGE_STATES = {
    READY: { text: '●', color: '#00c851' },
    SYNCING: { text: '⟳', color: '#ffa500' },
    ERROR: { text: '✕', color: '#ff4444' },
    IDLE: { text: '', color: '#888888' }
};

/**
 * Update extension badge
 */
function updateBadge(state) {
    const { text, color } = BADGE_STATES[state] || BADGE_STATES.IDLE;
    
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color });
}

/**
 * Pulse animation for ready state
 */
function pulseBadge() {
    let count = 0;
    const maxPulses = 6;
    
    updateBadge('READY');
    
    const interval = setInterval(() => {
        count++;
        const color = count % 2 === 0 ? '#00c851' : '#00ff00';
        chrome.action.setBadgeBackgroundColor({ color });
        
        if (count >= maxPulses) {
            clearInterval(interval);
        }
    }, 300);
}

// Storage cache for instant UI load
let cachedUsageData = null;

/**
 * Cache user data from Supabase to chrome.storage.local for instant UI
 */
async function cacheUsageData() {
    try {
        const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/get_usage_status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                "apikey": CONFIG.SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ p_seller_id: CONFIG.SELLER_ID })
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                cachedUsageData = data[0];
                await chrome.storage.local.set({ 
                    'cached_usage': cachedUsageData,
                    'usage_last_updated': Date.now()
                });
                
                console.log('[Background] Usage data cached:', cachedUsageData);
                
                // Track usage milestone events
                await trackUsageMilestones(cachedUsageData);
            }
        }
    } catch (error) {
        console.warn('[Background] Failed to cache usage data:', error);
    }
}

/**
 * Track milestone events for email triggers
 */
async function trackUsageMilestones(usage) {
    const { links_used, links_limit, plan_type } = usage;
    
    // Milestone thresholds for retention emails
    const milestones = [
        { threshold: 10, event: 'milestone_10', message: 'You\'re on fire! 🔥' },
        { threshold: 15, event: 'milestone_15', message: 'Almost at your limit...' },
        { threshold: 18, event: 'milestone_18', message: 'Last chance to upgrade!' }
    ];

    const reachedMilestone = milestones.find(m => links_used === m.threshold);
    
    if (reachedMilestone) {
        await events.limitReached({
            plan_type,
            links_used,
            links_limit,
            trigger: 'milestone_email',
            milestone_event: reachedMilestone.event,
            milestone_message: reachedMilestone.message
        });
        
        console.log(`[Background] Milestone reached: ${reachedMilestone.event}`);
    }
}

/**
 * Refresh cached data if stale (>5 minutes)
 */
async function refreshStaleCache() {
    const result = await chrome.storage.local.get(['usage_last_updated']);
    const lastUpdated = result.usage_last_updated || 0;
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    if (lastUpdated < fiveMinutesAgo) {
        await cacheUsageData();
    }
}

/**
 * Listen for messages from content script and popup
 */
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    switch (request.action) {
        case 'dataCaptured':
            // Trigger pulse animation when data is synced
            pulseBadge();
            
            // Track link generation event
            await events.linkGenerated({
                plan_type: cachedUsageData?.plan_type || 'starter',
                usage_count: cachedUsageData?.links_used || 0,
                variant_id: request.variant_id,
                product_title: request.product_title
            });
            
            // Refresh usage cache after link generation
            await cacheUsageData();
            
            sendResponse({ status: 'ok' });
            break;
            
        case 'getCachedUsage':
            // Instant UI load from cache
            const cache = await chrome.storage.local.get(['cached_usage', 'usage_last_updated']);
            sendResponse({ 
                usage: cache.cached_usage || null,
                lastUpdated: cache.usage_last_updated || 0
            });
            break;
            
        case 'refreshUsage':
            // Force refresh from Supabase
            await cacheUsageData();
            sendResponse({ status: 'refreshed' });
            break;
            
        case 'limitReached':
            // Track limit reached event
            await events.limitReached({
                plan_type: cachedUsageData?.plan_type || 'starter',
                links_used: cachedUsageData?.links_used || 0,
                links_limit: cachedUsageData?.links_limit || 20,
                trigger: 'checkout_attempt'
            });
            
            sendResponse({ status: 'tracked' });
            break;
            
        case 'upgradeButtonClicked':
            // Track upgrade click event
            await events.upgradeButtonClicked({
                current_plan: cachedUsageData?.plan_type || 'starter',
                suggested_plan: 'pro',
                usage_percentage: cachedUsageData ? 
                    Math.round((cachedUsageData.links_used / cachedUsageData.links_limit) * 100) : 0,
                upgrade_source: 'limit_modal'
            });
            
            sendResponse({ status: 'tracked' });
            break;
            
        case 'getBadgeState':
            sendResponse({ state: 'ready' });
            break;
            
        case 'clearBadge':
            updateBadge('IDLE');
            sendResponse({ status: 'cleared' });
            break;
            
        case 'setSyncing':
            updateBadge('SYNCING');
            sendResponse({ status: 'syncing' });
            break;
            
        case 'setError':
            updateBadge('ERROR');
            sendResponse({ status: 'error' });
            break;
    }
    
    return true;
});

/**
 * Initialize on install
 */
chrome.runtime.onInstalled.addListener(async () => {
    console.log('[Antigravity Background] Service worker installed');
    updateBadge('IDLE');
    
    // Initial cache population and install tracking
    await cacheUsageData();
    
    // Track extension installation
    await events.extensionInstalled({
        version: chrome.runtime.getManifest().version
    });
});

console.log('[Antigravity Background] Service worker active');
