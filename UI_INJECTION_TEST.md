# Messenger UI Injection - Testing Guide
## Current Focus: Frontend UI (Backend Ready ✅)

**Backend Status**: ✅ Shopify Secret set in Supabase | ✅ Vector Search enabled

**Current Task**: Test 🚀 button injection into Messenger Composer

---

## Quick Test (30 seconds)

### 1. Load Extension
```
Chrome → Extensions (chrome://extensions) → Developer Mode ON
→ Load Unpacked → Select extension/ folder
```

### 2. Open Messenger
```
Navigate to: https://www.messenger.com/t/{any-conversation}
```

### 3. Verify Button Injection
Look for 🚀 button in the composer toolbar (next to Send button):

```
[Sticker] [GIF] [🚀] [Send Button]
           ^
           |
    Gradient purple button
```

### 4. Test Click
- Click the 🚀 button
- Should see:
  - Button scales down briefly (press effect)
  - Notification: "✅ Synced 15 messages!"
  - Extension icon: Green ● starts pulsing

---

## Verify Data Capture

### Check chrome.storage.local
Open DevTools on messenger.com (F12) → Console:

```javascript
// View stored messages
chrome.storage.local.get(['antigravity_messages', 'antigravity_context'], (data) => {
    console.log('Messages:', data.antigravity_messages);
    console.log('Context:', data.antigravity_context);
});
```

**Expected Output**:
```javascript
Messages: [
    {
        id: "msg_0",
        text: "I'll take the black hoodie",
        isSeller: false,
        role: "buyer",
        timestamp: 1707491234567,
        wordCount: 5
    },
    // ... 14 more messages
]

Context: {
    url: "https://www.messenger.com/t/1234567890",
    messenger_id: "1234567890",
    timestamp: 1707491234567
}
```

### Verify Vector Search Ready Flag
```javascript
chrome.storage.local.get(['vectorSearchReady'], (data) => {
    console.log('Vector Search Ready:', data.vectorSearchReady);
    // Should be: true
});
```

---

## Debug Issues

### Button Not Appearing
```javascript
// Check if content script loaded
console.log('[Antigravity]');
// Should show: "Extension Phase: UI Injection Active"

// Check for toolbar
const toolbar = document.querySelector('[data-testid="mw_composer_toolbar"]');
console.log('Toolbar found:', !!toolbar);
```

### Messages Not Capturing
```javascript
// Test message scraping
const nodes = document.querySelectorAll('[data-testid="message_container"]');
console.log('Message nodes found:', nodes.length);
```

### Storage Not Working
```javascript
// Test storage API
chrome.storage.local.set({test: 'data'}, () => {
    console.log('Storage working:', !chrome.runtime.lastError);
});
```

---

## Integration Test (Next Step)

After UI Injection works:

```bash
# 1. Click 🚀 in Messenger (syncs messages)

# 2. Open extension popup
# Should read: chrome.storage.local.get(['antigravity_messages'])

# 3. Popup calls Edge Function
# POST /functions/v1/analyze-conversation
# Body: {messages: [...], seller_id: "..."}

# 4. Edge Function response
# Returns: {product_id, variant_id, checkout_url}

# 5. Popup displays checkout link
# Auto-copies to clipboard
```

---

## Success Criteria

- [ ] 🚀 Button visible in Messenger composer
- [ ] Button click captures 15 messages
- [ ] Data stored in chrome.storage.local
- [ ] Pulse animation on extension icon
- [ ] Message structure matches Vector Search requirements
- [ ] messenger_id extracted from URL

**Status**: 🎯 UI Injection ready for end-to-end testing
