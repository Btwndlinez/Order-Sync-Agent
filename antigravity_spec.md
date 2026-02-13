# Antigravity Architecture: High-Velocity Technical Spec

This document outlines the "Antigravity" architecture for the Order Sync Agent, focusing on eliminating latency and maximizing responsiveness.

## 1. Extension: "Ghost-Reader" (Zero-Latency Context)
- **Strategy:** Pre-warm context to make suggestions "instant".
- **Implementation:**
    - **MutationObserver:** Use `MutationObserver` in `content.js` to maintain a local buffer of the last 10 messages in `chrome.storage.session`. Avoid full DOM scrapes on click.
    - **Selective Scraping:** Target only `[role="presentation"]` or specific message classes to minimize CPU usage.
    - **"Pre-flight" Hook:** Trigger a background "warm-up" call to the Edge Function on extension icon hover.

## 2. LLM Tuning: "Fast-Path" (Low TTFT)
- **Model Choice:** Use **Claude 3 Haiku** or **GPT-4o-mini** for lowest Time-to-First-Token.
- **Prompt Strategy:** Strict XML tagging and few-shot examples to minimize hallucinations and parsing time.
    ```xml
    <system>
    You are an Order Sync Agent. Extract order data with zero prose.
    Return ONLY valid JSON.
    </system>
    <examples>...</examples>
    <task>...</task>
    ```

## 3. Database & API: "Zero-Wait" Performance
- **Vector Search:** Use **Supabase Vector (pgvector)** for product matching.
    - Embed product titles.
    - Perform 10ms vector similarity search to find `variant_id` parallel to LLM intent extraction.
- **Caching:** Cache `shopify_access_token` using Redis (Upstash) or Edge Function global variables (5-min TTL) to avoid DB tech on every request.

## 4. Edge Function Refactor: `quick-analyze`
- **Pattern:** Parallel Processing.
    ```typescript
    const [intentData, matchedProduct] = await Promise.all([
      getLLMIntent(messages), // Extract quantity/variant
      vectorSearch(messages.last()) // Find variant_id in DB
    ]);
    ```
- **Schema Update:** Add `catalog_last_synced` and `search_vector` columns to the products table.

## 5. UI: "Instant Copy" Feedback Loop
- **Auto-Copy:** Automatically copy generated checkout URLs to clipboard.
- **Optimistic UI:** Show "Generated!" state immediately.
- **Badge Notification:** Display product name/count on the extension badge if confidence is high.

## 6. Audit: The "Gravity" Fixes
| Component | Legacy "Weight" | Antigravity Fix |
| --- | --- | --- |
| **DOM Reading** | ~200ms | MutationObserver Buffer |
| **LLM Processing** | 1.5s - 3s | Haiku/GPT-4o-mini + Vector Search |
| **Shopify API** | 500ms - 1s | Draft Order "Quick-Create" |
| **UI Loading** | ~300ms | Optimistic UI |
