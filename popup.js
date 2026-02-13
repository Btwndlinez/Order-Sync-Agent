/**
 * Order Sync Agent - Popup Logic (Antigravity Nerve Center)
 * Fast, contextual UI for creating checkout links from Messenger conversations
 */

const SUPABASE_URL = 'https://your-project.supabase.co';
const API_URL = `${SUPABASE_URL}/functions/v1`;
const SUPABASE_ANON_KEY = 'your-anon-key'; // Replace with your key

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorStateEl = document.getElementById('error-state');
const suggestionCardEl = document.getElementById('suggestion-card');
const successCardEl = document.getElementById('success-card');
const emptyStateEl = document.getElementById('empty-state');
const contentEl = document.getElementById('content');

// State
let currentAnalysisResult = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await analyzeConversation();
  
  // Bind button events
  document.getElementById('btn-generate').addEventListener('click', generateCheckout);
  document.getElementById('btn-copy').addEventListener('click', copyToClipboard);
  document.getElementById('btn-retry').addEventListener('click', analyzeConversation);
  document.getElementById('btn-refresh').addEventListener('click', analyzeConversation);
});

/**
 * Main analysis function - pulls from Ghost-Reader and calls Edge Function
 */
async function analyzeConversation() {
  showLoading();
  
  try {
    // 1. Get Ghost-Reader data from content script
    const data = await chrome.storage.session.get(['lastConversation']);
    
    if (!data.lastConversation || data.lastConversation.length === 0) {
      showError('No conversation detected. Open a Messenger chat first.');
      return;
    }

    // 2. Call analyze-conversation Edge Function
    const response = await fetch(`${API_URL}/analyze-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        messages: data.lastConversation,
        seller_id: 'your-seller-id', // TODO: Get from extension storage
        messenger_id: 'current-chat-id' // TODO: Scrape from content script
      })
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`);
    }

    const result = await response.json();
    currentAnalysisResult = result;

    // 3. Handle result
    if (result.intent_detected) {
      showSuggestion(result);
    } else {
      showEmptyState();
    }

  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message || 'Failed to analyze conversation');
  }
}

/**
 * Display the product suggestion card
 */
function showSuggestion(data) {
  hideAllStates();
  
  // Populate card data
  document.getElementById('prod-title').textContent = data.product_title || 'Product Match';
  document.getElementById('prod-variant').textContent = data.variant_title || 'Default';
  document.getElementById('prod-qty').textContent = `Qty: ${data.quantity || 1}`;
  document.getElementById('trigger-text').textContent = `"${data.trigger_message || 'No trigger message'}"`;
  
  suggestionCardEl.classList.remove('hidden');
}

/**
 * Generate checkout link and show success
 */
async function generateCheckout() {
  if (!currentAnalysisResult || !currentAnalysisResult.variant_id) {
    alert('No product variant selected');
    return;
  }

  const btn = document.getElementById('btn-generate');
  btn.textContent = 'Creating...';
  btn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        variant_id: currentAnalysisResult.variant_id,
        quantity: currentAnalysisResult.quantity || 1
      })
    });

    if (!response.ok) {
      throw new Error(`Checkout creation failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Antigravity: Auto-copy to clipboard immediately
    if (result.checkout_url) {
      await navigator.clipboard.writeText(result.checkout_url);
      showSuccess(result.checkout_url, true);
    } else {
      throw new Error('No checkout URL returned');
    }

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Failed to create checkout: ' + error.message);
    
    // Reset button
    btn.textContent = 'Generate Checkout Link';
    btn.disabled = false;
  }
}

/**
 * Show success card with checkout URL
 */
function showSuccess(url, autoCopied = false) {
  hideAllStates();
  
  document.getElementById('checkout-url').value = url;
  successCardEl.classList.remove('hidden');
  
  if (autoCopied) {
    const copyBtn = document.getElementById('btn-copy');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy Link';
    }, 2000);
  }
}

/**
 * Copy checkout URL to clipboard
 */
async function copyToClipboard() {
  const urlInput = document.getElementById('checkout-url');
  const url = urlInput.value;
  
  if (!url) return;
  
  try {
    await navigator.clipboard.writeText(url);
    const btn = document.getElementById('btn-copy');
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy Link';
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
    // Fallback: select the input
    urlInput.select();
    document.execCommand('copy');
  }
}

/**
 * Show loading state
 */
function showLoading() {
  hideAllStates();
  loadingEl.classList.remove('hidden');
}

/**
 * Show error state
 */
function showError(message) {
  hideAllStates();
  errorStateEl.querySelector('.error-text').textContent = message;
  errorStateEl.classList.remove('hidden');
}

/**
 * Show empty state (no intent detected)
 */
function showEmptyState() {
  hideAllStates();
  emptyStateEl.classList.remove('hidden');
}

/**
 * Hide all state containers
 */
function hideAllStates() {
  loadingEl.classList.add('hidden');
  errorStateEl.classList.add('hidden');
  suggestionCardEl.classList.add('hidden');
  successCardEl.classList.add('hidden');
  emptyStateEl.classList.add('hidden');
}

/**
 * Pre-flight hook - warm up analysis on icon hover (Phase 2)
 * This would be triggered by background script when user hovers extension icon
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'preFlightAnalysis') {
    // Warm up the connection, maybe do lightweight analysis
    console.log('Pre-flight analysis triggered');
    sendResponse({ status: 'warming' });
  }
});
