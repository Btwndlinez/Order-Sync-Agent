# Order Sync Agent

Website: https://ordersyncagent.com

AI-powered conversation analysis for social commerce. Detects purchase intent from Facebook Messenger conversations and generates Shopify checkout links.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run tests
npm test
```

## Project Structure

```
ORDER SYNC/
├── supabase/
│   └── functions/
│       ├── _shared/
│       │   ├── prompts.ts      # LLM prompt templates
│       │   └── types.ts        # TypeScript interfaces
│       └── analyze-conversation/
│           └── index.ts        # Edge function
├── tests/
│   ├── test-conversations.json # Test dataset (10 scenarios)
│   └── test-prompt.ts          # Test runner
├── package.json
└── .env.example
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LLM_API_KEY` | API key for OpenAI-compatible LLM |
| `LLM_BASE_URL` | API base URL (default: OpenAI) |
| `LLM_MODEL` | Model to use (default: gpt-4o) |

## Testing

The test suite includes 10 conversation scenarios:

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

Target: 90%+ accuracy on test suite.

## Edge Function Usage

```typescript
// POST /analyze-conversation
{
  "messages": [
    {"role": "buyer", "text": "Is the hoodie available?", "timestamp": "..."},
    {"role": "seller", "text": "Yes! What size?", "timestamp": "..."},
    {"role": "buyer", "text": "Medium. I'll take 2", "timestamp": "..."}
  ],
  "shopify_products": [
    {
      "id": "prod_123",
      "title": "Premium Hoodie",
      "variants": [
        {"id": "var_m", "title": "Medium", "price": "45.00"}
      ]
    }
  ]
}

// Response
{
  "intent_detected": true,
  "confidence": 0.95,
  "product_id": "prod_123",
  "variant_id": "var_m",
  "quantity": 2,
  "total_value": 90.00,
  "trigger_message": "Medium. I'll take 2",
  "reasoning": "..."
}
```

## Phase 1 Features

- ✅ Conversation analysis with intent detection
- ✅ Product/variant matching from Shopify catalog
- ✅ Confidence scoring (0.00 - 1.00)
- ✅ Quantity parsing (including "pair", "couple")
- ✅ Cancellation detection ("never mind")
