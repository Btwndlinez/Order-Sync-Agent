# Order Sync Agent - Product Requirements Document (PRD)

**Version**: 1.0  
**Status**: Phase 2 In Progress  
**Last Updated**: 2026-02-09

---

## 1. Product Vision

### Mission Statement
Enable social commerce sellers to instantly convert Facebook Messenger conversations into Shopify checkout links with zero friction.

### Core Value Proposition
- **Speed**: Sub-5-second checkout generation
- **Accuracy**: 90%+ intent detection accuracy
- **Zero Typing**: One-click link generation and auto-copy

---

## 2. User Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Buyer sends message in Messenger                          │
│  "I'll take the black hoodie in medium"                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  Seller clicks 🚀 button (Smart Composer)                  │
│  OR opens extension popup                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  System analyzes last 15 messages                           │
│  • Extracts intent (STRONG/MEDIUM/WEAK)                     │
│  • Matches product via DB (fuzzy → vector)                  │
│  • Calculates quantity & price                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  Shopify draft order created                               │
│  Checkout URL auto-copied to clipboard                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  Seller pastes link in Messenger                           │
│  Buyer clicks → Checkout → Conversion!                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Architecture

### 3.1 Three-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: UI (Presentation)                                │
│  ├── Smart Composer (🚀 button) - content.js               │
│  ├── Extension Popup (popup.html/js/ts)                    │
│  └── Auto-copy & notifications                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ Chrome Extension APIs
┌───────────────────────▼─────────────────────────────────────┐
│  LAYER 2: Edge Functions (Logic)                           │
│  ├── analyze-conversation: LLM + DB matching               │
│  │   ├── LLM: Intent extraction (Moonshot/OpenAI)          │
│  │   └── DB: Product matching (fuzzy + vector)             │
│  └── create-checkout: Shopify API integration              │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP API
┌───────────────────────▼─────────────────────────────────────┐
│  LAYER 1: Data (Content Script)                            │
│  ├── Ghost-Reader: MutationObserver on Messenger           │
│  └── Storage: chrome.storage.local/session                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

1. **Content Script** (`content.js`) injects 🚀 button
2. On click: captures last 15 messages → `chrome.storage.local`
3. **Popup** (if used) reads storage → calls Edge Function
4. **Edge Function** (`analyze-conversation`):
   - LLM extracts product name, quantity, intent
   - DB searches: `find_matching_products()` → `find_products_by_semantic_similarity()`
   - Returns: `product_id`, `variant_id`, `price`, `confidence`
5. **Edge Function** (`create-checkout`):
   - Calls Shopify Admin API
   - Creates draft order
   - Returns: `checkout_url`
6. **UI** auto-copies URL → shows success

---

## 4. API Specifications

### 4.1 Edge Function: analyze-conversation

**Endpoint**: `POST /functions/v1/analyze-conversation`

**Request**:
```json
{
  "messages": [
    {
      "text": "I'll take the black hoodie",
      "isSeller": false,
      "timestamp": 1707491234567
    }
  ],
  "seller_id": "uuid",
  "messenger_id": "conv-123"
}
```

**Response**:
```json
{
  "intent_detected": true,
  "confidence": 0.95,
  "product_id": "123456789",
  "variant_id": "987654321",
  "product_title": "Premium Black Hoodie",
  "variant_title": "Medium",
  "quantity": 1,
  "total_value": 49.99,
  "trigger_message": "I'll take the black hoodie",
  "reasoning": "Strong commitment language"
}
```

### 4.2 Edge Function: create-checkout

**Endpoint**: `POST /functions/v1/create-checkout`

**Request**:
```json
{
  "variant_id": "987654321",
  "quantity": 2
}
```

**Response**:
```json
{
  "success": true,
  "checkout_url": "https://checkout.shopify.com/123/checkouts/abc",
  "draft_order_id": "12345",
  "draft_order_name": "#D1001"
}
```

### 4.3 Database RPC Functions

**find_matching_products**:
```sql
SELECT * FROM find_matching_products(
  p_seller_id := 'uuid',
  p_search_term := 'black hoodie',
  p_limit := 5
);
```

**find_products_by_semantic_similarity**:
```sql
SELECT * FROM find_products_by_semantic_similarity(
  p_seller_id := 'uuid',
  p_embedding := [0.1, 0.2, ...], -- 1536 dimensions
  p_limit := 5
);
```

---

## 5. Prompt Engineering

### 5.1 System Prompt

```xml
<system>
You are an Order Sync Agent. Extract order data with zero prose.
Return ONLY valid JSON.
Highly accurate and conservative.

Step 1: Intent Detection (STRONG: commitment, payment readiness, confirmation).
Step 2: Product Matching (Exact title, variant options, quantity).
Step 3: Confidence (0.50+ to trigger).
</system>

<examples>
Input:
Conversation:
BUYER: "Hey do you still have the black hoodie?"
SELLER: "Yes! What size?"
BUYER: "Medium. I'll take 2"
Output: 
{
  "intent_detected": true,
  "confidence": 0.95,
  "product_id": "prod_123",
  "variant_id": "var_2",
  "product_title": "Premium Black Hoodie",
  "variant_title": "Medium",
  "quantity": 2,
  "total_value": 90.00,
  "trigger_message": "Medium. I'll take 2",
  "reasoning": "Buyer explicitly committed with quantity and size."
}
</examples>

<task>
Analyze the following conversation:
<conversation>
{{MESSAGES}}
</conversation>

Match against catalog:
<catalog>
{{SHOPIFY_PRODUCTS}}
</catalog>

Critical Rules:
1. Return ONLY JSON.
2. product_id/variant_id MUST exist in catalog.
3. Default qty 1.
4. price = qty * variant.price.
5. Ignore seller for intent.
</task>
```

### 5.2 Prompt Strategy

- **XML Tagging**: Structured input/output for consistent parsing
- **Zero Prose**: JSON-only responses, no explanations
- **Few-Shot Examples**: Include 3-5 examples in system prompt
- **Strict Validation**: `product_id` must exist in catalog
- **Conservative**: Confidence < 0.50 = no intent detected

---

## 6. Performance Requirements

### 6.1 Latency Targets (Antigravity Spec)

| Component | Legacy | Antigravity Target | Current Status |
|-----------|--------|-------------------|----------------|
| DOM Reading | ~200ms | MutationObserver Buffer | ✅ Implemented |
| LLM Processing | 1.5-3s | < 500ms (Haiku/GPT-4o-mini) | ⚠️ Testing |
| Product Matching | 100ms+ | < 10ms (Vector Search) | ✅ Implemented |
| Shopify API | 500ms-1s | < 300ms (Quick-Create) | ⚠️ Testing |
| UI Loading | ~300ms | Optimistic UI | ✅ Implemented |
| **Total** | **2-5s** | **< 5s** | **🎯 Target** |

### 6.2 Throughput

- Edge Function: 100 req/min (Supabase free tier)
- Shopify API: 2 req/sec (basic plan)
- Vector Search: < 10ms per query

---

## 7. Database Schema

### 7.1 Core Tables

```sql
-- Sellers (multi-tenant)
sellers (
  id UUID PRIMARY KEY,
  shopify_domain TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMP
);

-- Products (with vector embeddings)
products (
  id TEXT PRIMARY KEY,
  seller_id UUID REFERENCES sellers(id),
  title TEXT NOT NULL,
  description TEXT,
  variants JSONB,
  price DECIMAL,
  embedding VECTOR(1536),  -- For semantic search
  search_text TEXT,         -- For fuzzy search
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP
);

-- Conversations (analytics)
conversations (
  id UUID PRIMARY KEY,
  seller_id UUID,
  messenger_id TEXT,
  messages JSONB,
  intent_detected BOOLEAN,
  detected_product_id TEXT,
  confidence_score DECIMAL,
  created_at TIMESTAMP
);

-- Generated Checkouts
generated_checkouts (
  id UUID PRIMARY KEY,
  seller_id UUID,
  conversation_id UUID,
  product_id TEXT,
  variant_id TEXT,
  checkout_url TEXT,
  status TEXT,
  created_at TIMESTAMP
);
```

### 7.2 Security (RLS)

```sql
-- Sellers can only see their own data
CREATE POLICY "Sellers can view own data" ON sellers
  FOR ALL USING (auth.uid() = id);

-- Products filtered by seller_id
CREATE POLICY "Sellers can view own products" ON products
  FOR ALL USING (seller_id = auth.uid());
```

---

## 8. AI Provider Configuration

### 8.1 Primary: Moonshot (Kimi K2.5)

```bash
LLM_API_KEY=your-moonshot-key
LLM_BASE_URL=https://api.moonshot.ai/v1
LLM_MODEL=kimi-k2.5
```

**Why Moonshot?**
- Excellent Chinese/Asian market support
- Fast response times
- Cost-effective
- OpenAI-compatible API

### 8.2 Alternative: OpenAI

```bash
LLM_API_KEY=sk-your-openai-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini  # For speed
```

### 8.3 Alternative: OpenRouter

```bash
LLM_API_KEY=your-openrouter-key
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=anthropic/claude-3-haiku  # Fastest
```

---

## 9. Testing Requirements

### 9.1 Test Scenarios (10 Total)

1. **Perfect Match** - Single item with clear intent
2. **Multiple Quantities** - "Can I get 3?"
3. **Just Browsing** - No purchase intent
4. **Variant Mismatch** - Product exists, variant doesn't
5. **Multi-Option Variant** - Size + color selection
6. **Changed Mind** - Cancellation after initial intent
7. **Fuzzy Match** - Casual language ("yeezys", "grab em")
8. **Multiple Products** - Correct catalog selection
9. **Implicit Quantity** - "a pair" = 2
10. **Price Inquiry** - No commitment

### 9.2 Success Criteria

- Intent Detection: > 90% accuracy
- Product Matching: > 90% match rate
- End-to-End: < 5 seconds total

---

## 10. File Structure

```
ORDER SYNC/
├── content.js                    # Smart Composer 🚀 (Phase 2)
├── content.ts                    # Ghost-Reader (legacy)
├── popup.tsx                     # React popup
├── popup.html / popup.css / popup.js  # Vanilla popup
├── tsconfig.json                 # TypeScript config
├── package.json                  # Extension manifest
├── .env                          # Environment variables
├── .env.example                  # Template
├── PROGRESS.md                   # This file
├── antigravity_spec.md          # Antigravity technical spec
├── AI_PROVIDERS.md              # AI configuration guide
├── PHASE1_CHECKLIST.md          # Deployment checklist
├── CONTENT_SCRIPT_DEBUG.md      # Testing guide
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│   └── functions/
│       ├── analyze-conversation/
│       │   └── index.ts
│       ├── create-checkout/
│       │   └── index.ts
│       └── _shared/
│           ├── prompts.ts
│           └── types.ts
└── tests/
    ├── test-conversations.json
    └── test-prompt.ts
```

---

## 11. Current Status & Next Steps

### ✅ Completed
- Database schema with pgvector
- Edge Functions (analyze-conversation, create-checkout)
- Smart Composer (content.js with 🚀 button)
- Product matching (fuzzy + semantic)
- AI provider configuration (Moonshot)
- TypeScript configuration fixed

### 🚧 In Progress
- End-to-end testing
- Shopify product sync
- Performance optimization

### 📋 Next Steps
1. Test Smart Composer on messenger.com
2. Sync Shopify products to database
3. Set Moonshot API key in Supabase secrets
4. Run test suite (target: 90%+ accuracy)
5. Deploy to production

---

## 12. Key Metrics

- **Time to Checkout**: < 5 seconds
- **Intent Detection Accuracy**: > 90%
- **Product Match Rate**: > 90%
- **User Adoption**: Daily active sellers
- **Conversion Rate**: % of links → purchases

---

**Document Owner**: Antigravity Team  
**Review Cycle**: Weekly during development
