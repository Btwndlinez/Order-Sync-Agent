# Order Sync Agent - Developer Handoff Checklist

## Phase 1 Completion Status: 90%

### ✅ Completed Components

#### 1. Ghost-Reader Extension (Content Script)
- **File**: `content.ts`
- **Function**: Monitors Messenger DOM and buffers last 20 messages
- **Storage**: Uses `chrome.storage.session` for instant popup access
- **Status**: Production-ready

#### 2. Popup UI (Nerve Center)
- **File**: `popup.tsx`
- **Features**:
  - Facebook Messenger-style design (native feel)
  - Auto-analyzes conversation on open
  - Shows product suggestion with buyer quote
  - One-click checkout generation
  - Auto-copy to clipboard
  - Loading, error, empty, and success states
- **Status**: Production-ready

#### 3. Edge Functions
- **analyze-conversation**: Detects purchase intent from messages
- **create-checkout**: Creates Shopify draft orders
- **Status**: Both implemented, need environment configuration

---

## 🔧 Required Setup Steps

### Step 1: Environment Variables

#### `.env` File - Local Development
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres

# LLM (OpenAI or compatible)
OPENAI_API_KEY=sk-your-api-key
# Or for other providers:
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o

# Extension
PLASMO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PLASMO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Supabase Secrets (Production)
Run these commands in Supabase CLI:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key
supabase secrets set SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
supabase secrets set SHOPIFY_API_KEY=your-api-key
supabase secrets set SHOPIFY_API_SECRET=your-api-secret
```

**Note**: The code now uses API Key + Secret Key authentication. You can get these from your Shopify Partner Dashboard → Apps → App setup → API credentials.

### Step 2: Database Setup

#### 1. Enable pgvector Extension
```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2. Create Products Table
```sql
CREATE TABLE IF NOT EXISTS shopify_products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    variants JSONB DEFAULT '[]',
    price DECIMAL(10,2),
    image_url TEXT,
    embedding VECTOR(1536), -- For semantic search
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX idx_products_embedding ON shopify_products 
USING ivfflat (embedding vector_cosine_ops);
```

#### 3. Create Conversations Table (Optional - for analytics)
```sql
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    messenger_id TEXT,
    messages JSONB,
    intent_detected BOOLEAN,
    product_id TEXT,
    checkout_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 3: Shopify Integration

#### 1. Create Private App in Shopify
1. Go to Settings → Apps and sales channels
2. Click "Develop apps"
3. Create an app called "Order Sync Agent"
4. Enable Admin API access with these scopes:
   - `read_products`
   - `write_draft_orders`
5. Install the app and copy the access token

#### 2. Sync Products to Supabase
Create a script to sync your Shopify catalog:
```typescript
// scripts/sync-products.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

async function syncProducts() {
    // Fetch from Shopify
    const products = await fetchShopifyProducts()
    
    // Generate embeddings for each product
    for (const product of products) {
        const embedding = await generateEmbedding(product.title + ' ' + product.description)
        
        await supabase.from('shopify_products').upsert({
            id: product.id,
            title: product.title,
            description: product.description,
            variants: product.variants,
            price: product.variants[0]?.price,
            image_url: product.images[0]?.src,
            embedding: embedding
        })
    }
}
```

### Step 4: Test the Extension

#### 1. Build and Load Extension
```bash
npm run build
# Load build/chrome-mv3-prod folder in Chrome Developer Mode
```

#### 2. Test Flow
1. Open Facebook Messenger
2. Have a conversation about buying a product
3. Click the extension icon
4. Verify:
   - Popup loads instantly
   - Analysis completes
   - Product suggestion appears
   - Checkout link generates and copies

#### 3. Edge Function Testing
Test analyze-conversation:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/analyze-conversation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"text": "I want to buy the blue shirt", "isSeller": false}],
    "shopify_products": [{"id": "123", "title": "Blue Cotton Shirt", "variants": []}]
  }'
```

Test create-checkout:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-checkout \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "123456789",
    "quantity": 2
  }'
```

---

## 🚀 Next Steps (Phase 2)

### 1. Product Matching Enhancement
- [ ] Implement semantic search using pgvector
- [ ] Sync Shopify catalog to Supabase
- [ ] Add product image previews in popup
- [ ] Cache product embeddings

### 2. Performance Optimization
- [ ] Add pre-flight analysis on icon hover
- [ ] Implement optimistic UI for instant feedback
- [ ] Cache checkout links for repeated use
- [ ] Add Chrome badge notifications for high-confidence matches

### 3. Analytics & Monitoring
- [ ] Log conversation analyses
- [ ] Track conversion rates
- [ ] Monitor Edge Function performance
- [ ] Add error alerting

---

## 📁 File Structure

```
ORDER SYNC/
├── content.ts                    # Ghost-Reader (Phase 1 ✓)
├── popup.tsx                     # Nerve Center UI (Phase 1 ✓)
├── package.json                  # Extension manifest
├── .env                          # Local secrets (not committed)
├── .env.example                  # Template for env vars
├── supabase/
│   └── functions/
│       ├── analyze-conversation/ # Intent detection (Phase 1 ✓)
│       │   └── index.ts
│       ├── create-checkout/      # Draft orders (Phase 1 ✓)
│       │   └── index.ts
│       └── _shared/
│           ├── prompts.ts        # LLM prompts
│           └── types.ts          # TypeScript types
└── CHECKLIST.md                  # This file
```

---

## 🐛 Known Issues & Limitations

1. **DOM Scraping**: Current selector may need adjustment if Facebook changes Messenger structure
2. **Product Catalog**: Currently requires manual sync from Shopify
3. **Rate Limits**: Shopify API has rate limits (2 calls/second for basic)
4. **CORS**: Edge Functions handle CORS, but local testing may require CORS extension

---

## 🆘 Support & Troubleshooting

### Extension not detecting messages?
- Check Chrome DevTools console for content script errors
- Verify you're on messenger.com (not facebook.com/messages)
- Check if Facebook DOM structure has changed

### Edge Function errors?
- Verify environment variables are set correctly
- Check Supabase Functions logs in dashboard
- Test functions with curl commands above

### Checkout creation failing?
- Verify Shopify access token has correct permissions
- Check variant_id format (should be numeric string)
- Review Shopify API rate limits

---

## ✨ Success Metrics

Track these KPIs to measure success:
- **Time to Checkout**: Target <5 seconds from popup open
- **Intent Detection Accuracy**: Target >85% true positive rate
- **Conversion Rate**: % of detected intents that result in checkout
- **Seller Adoption**: Daily active users

---

**Last Updated**: 2026-02-09  
**Phase 1 Status**: 90% Complete - Ready for Shopify Integration
