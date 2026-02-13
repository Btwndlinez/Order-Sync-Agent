# PRODUCT_SPEC.md: Order Sync Agent (Channel Assist)

## 1. Vision & Core Value

**The Wedge:** A high-speed "Workstation" Side Panel that turns messy chat messages into checkout links in < 10 seconds.

**The Goal:** Eliminate manual SKU searching and link generation for social sellers.

---

## 2. System Architecture

**Platform:** Chrome Extension (Manifest V3)

**Primary UI:** Native chrome.sidePanel

**State Management:** Zustand with persist middleware (Sync to chrome.storage.local)

**Intelligence:**
- Passive Detection: MutationObserver in Content Script for zero-click entry
- Intent Extraction: LLM (Gemini 1.5 Flash) via JSON-mode API
- Fuzzy Matcher: Semantic search matching intent to a Unified Canonical Product Model

---

## 3. Product Features (MVP)

### 3.1 Hybrid Catalog Ingestion

One normalized internal schema fed by three pipes:

- **Manual:** Fast-add form (Title, SKU, Price)
- **CSV:** Intelligent mapper with synonym-based header guessing
- **Shopify (Tier Gated):** OAuth sync for variants and inventory

### 3.2 The 10-Second Sales Loop

1. **Capture:** User highlights text or Observer detects "Purchase Intent."
2. **Extract:** Panel shows: Product: Hoodie | Color: Black | Qty: 2
3. **Match:** Fuzzy lookup links extracted text to specific SKU
4. **Compose:** Auto-generate a friendly reply + short cart link
5. **Finish:** One-click copy with haptic/visual success feedback

### 3.3 Context-Aware Detection

- Observer watches DOM for new messages
- Heuristic filter (keywords/digits) prevents noise
- Non-invasive "Intent Detected" card appears in Side Panel

---

## 4. Technical Constraints

- **Performance:** UI must be interactive in < 300ms. AI analysis < 1.5s
- **Privacy:** No scraping of full chat history. Read only visible/highlighted messages
- **Reliability:** Fallback to manual paste mode if DOM selectors fail

---

## 5. Monetization & Usage Tiers

| Feature | Free | Starter ($10/mo) | Pro ($19/mo) |
|---------|------|------------------|--------------|
| Generations | 10 / month | Unlimited | Unlimited |
| Ingestion | Manual Only | CSV + Manual | Shopify Auto-Sync |
| History | 3 Recent Links | Full History | Multi-Store History |
| Detection | Manual Paste | Passive Detection | Proactive AI Agent |

---

## 6. Component Hierarchy (React)

- **Root:** Auth & Tier Validation
- **MainShell:** Header, Usage Meter, View Switcher
- **InputPanel:** Textarea, Selection Relay, Detection Alerts
- **ResultPanel:** Suggestion Cards, Disambiguation Modal, Copy Button
- **CatalogHub:** Ingestion workflows and SKU management
- **HistoryLog:** Recent activity list for quick re-copying

---

## 7. Next Build Milestones (The 48-Hour Sprint)

| Hours | Task |
|-------|------|
| H 1-8 | Scaffold Manifest V3 & Zustand Store (Persistence) |
| H 9-16 | Build Side Panel UI Shell & Manual Ingestion Form |
| H 17-24 | Implement Selection Relay & Keyword-based Mock Matcher |
| H 25-48 | Connect LLM Intent Extraction & Finalize "Copy" Dopamine Loop |

---

## Implementation Status

**Status:** ✅ MVP COMPLETE

All core features from this specification have been implemented in the current build.
