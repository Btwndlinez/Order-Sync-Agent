# Content Script Debugging Guide
## Bottom-Up Build: Verify Ghost-Reader Works First

This guide ensures the Content Script (Ghost-Reader) is working before testing the popup.

---

## Step 1: Build & Load Extension

```bash
# Build the extension
npm run build

# Or dev mode with hot reload
npm run dev
```

Load in Chrome:
1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-prod` folder

---

## Step 2: Test Content Script Injection

### Check if script is loaded:
1. Open Facebook Messenger (https://www.messenger.com)
2. Open any conversation
3. Press **F12** to open DevTools
4. Look at the **Console** tab

### ✅ Expected Output:
```
╔════════════════════════════════════════╗
║   Order Sync: Ghost-Reader v1.0       ║
║   Bottom-Up Build: Content Script     ║
╚════════════════════════════════════════╝
[Ghost-Reader] Initializing on: https://www.messenger.com/t/...
[Ghost-Reader] ✅ MutationObserver started
[Ghost-Reader] Running initial scrape...
[Ghost-Reader] Found X messages with selector: [role="presentation"] [dir="auto"]
[Ghost-Reader] ✅ Saved X messages to storage
```

### ❌ If you don't see this:
- Check if extension is enabled in `chrome://extensions`
- Check "Errors" button on the extension card
- Try reloading the extension
- Check if you're on messenger.com (not facebook.com/messages)

---

## Step 3: Verify Storage Data

### Method 1: Console Command
In DevTools console, run:
```javascript
chrome.storage.session.get(['lastConversation'], (data) => {
    console.log('Stored messages:', data.lastConversation);
});
```

### Expected Output:
```javascript
Stored messages: [
    {
        text: "Hi, do you have the black hoodie?",
        isSeller: false,
        timestamp: 1707491234567
    },
    {
        text: "Yes! We have it in stock",
        isSeller: true,
        timestamp: 1707491235567
    }
]
```

### Method 2: Application Tab
1. Open DevTools
2. Go to **Application** tab
3. Expand **Storage** → **Session storage**
4. Click on the messenger.com entry
5. Look for `lastConversation` key

---

## Step 4: Test Real-Time Updates

1. Keep DevTools console open
2. Send a new message in Messenger
3. Watch the console for:
   ```
   [Ghost-Reader] ✅ Saved X messages to storage
   [Ghost-Reader] Latest: "your new message text..."
   ```

If this doesn't appear:
- Check if MutationObserver is still running
- Look for errors in console
- Try refreshing the page

---

## Step 5: Debug Common Issues

### Issue 1: "No messages found yet..."
**Cause**: DOM selectors don't match Messenger's structure

**Fix**:
1. In DevTools, click the element picker (top left)
2. Click on a message bubble
3. Look at the HTML structure in Elements tab
4. Update `MESSAGE_SELECTORS` array in `content.ts` with the correct selector

### Issue 2: "Chrome APIs not available"
**Cause**: Content script not properly injected

**Fix**:
1. Check `manifest.json` has correct `matches` pattern
2. Ensure `permissions` includes `"storage"`
3. Reload extension and refresh page

### Issue 3: Messages not saving
**Cause**: Storage API error or permissions issue

**Fix**:
1. Check extension permissions in `chrome://extensions`
2. Look for storage errors in console
3. Try using `chrome.storage.local` instead of `chrome.storage.session`

### Issue 4: Wrong `isSeller` detection
**Cause**: Seller detection selectors outdated

**Fix**:
1. In DevTools, inspect your own (outgoing) messages
2. Look for unique attributes (data-testid, classes)
3. Add them to `SELLER_SELECTORS` array

---

## Step 6: Manual Trigger Test

Send a message from DevTools console:
```javascript
// Force an update
chrome.runtime.sendMessage({ action: 'forceUpdate' });

// Then check storage
chrome.storage.session.get(['lastConversation'], console.log);
```

---

## Step 7: Popup Integration Test

Once Ghost-Reader is confirmed working:

1. Click the extension icon
2. Open popup DevTools (right-click → Inspect)
3. Check console for:
   ```
   [Popup] Fetched X messages from storage
   [Popup] Sending to analyze-conversation...
   ```

If popup can't read storage:
- Verify `chrome.storage.session` is accessible from popup
- Check for cross-origin restrictions
- Ensure both content script and popup have `storage` permission

---

## Quick Debug Commands

```javascript
// Check if content script is running
chrome.runtime.sendMessage({ action: 'getMessages' }, console.log);

// Force re-initialization
location.reload();

// Clear stored data
chrome.storage.session.remove(['lastConversation']);

// List all storage keys
chrome.storage.session.get(null, console.log);
```

---

## Success Criteria

Before moving to popup testing, verify:
- [ ] Console shows "Ghost-Reader v1.0" initialization
- [ ] `lastConversation` appears in Session Storage
- [ ] Messages array contains actual text content
- [ ] New messages trigger storage updates
- [ ] `isSeller` correctly identifies outgoing messages

**Only proceed to popup.tsx testing after all checks pass!**
