# AI Provider Configuration

Order Sync Agent supports multiple AI providers via OpenAI-compatible APIs.

## Supported Providers

### 1. Moonshot (Recommended for Antigravity)
**Model**: `kimi-k2.5`

```bash
LLM_API_KEY=your-moonshot-api-key
LLM_BASE_URL=https://api.moonshot.ai/v1
LLM_MODEL=kimi-k2.5
```

**Why Moonshot?**
- Excellent Chinese language understanding (great for Asian markets)
- Fast response times for real-time conversation analysis
- Cost-effective compared to GPT-4
- Strong reasoning for purchase intent detection

**Get API Key**: https://platform.moonshot.ai

---

### 2. OpenAI
**Models**: `gpt-4o`, `gpt-4o-mini`

```bash
LLM_API_KEY=your-openai-api-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
```

**Best for**: English conversations, maximum accuracy

**Get API Key**: https://platform.openai.com

---

### 3. OpenRouter
**Models**: `anthropic/claude-3.5-sonnet`, `google/gemini-pro`

```bash
LLM_API_KEY=your-openrouter-api-key
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=anthropic/claude-3.5-sonnet
```

**Best for**: Access to multiple models, fallback options

**Get API Key**: https://openrouter.ai

---

### 4. Local Models (Ollama, LM Studio)

```bash
LLM_API_KEY=not-needed-for-local
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2
```

**Best for**: Privacy, offline operation, cost savings

---

## Configuration for Edge Functions

Set in Supabase Secrets:

```bash
# Using Moonshot (recommended)
supabase secrets set LLM_API_KEY=your-moonshot-key
supabase secrets set LLM_BASE_URL=https://api.moonshot.ai/v1
supabase secrets set LLM_MODEL=kimi-k2.5

# Or OpenAI
supabase secrets set LLM_API_KEY=sk-your-openai-key
supabase secrets set LLM_BASE_URL=https://api.openai.com/v1
supabase secrets set LLM_MODEL=gpt-4o-mini
```

## Provider Comparison

| Provider | Model | Speed | Cost | Best For |
|----------|-------|-------|------|----------|
| Moonshot | kimi-k2.5 | ⚡ Fast | 💰 Low | Chinese/Asian markets |
| OpenAI | gpt-4o | ⚡ Fast | 💰💰 Medium | English, max accuracy |
| OpenAI | gpt-4o-mini | ⚡⚡ Very Fast | 💰 Low | Quick analysis, cost-saving |
| OpenRouter | claude-3.5-sonnet | ⚡ Fast | 💰💰 Medium | Complex reasoning |

## Testing Your Provider

Test the API connection:

```bash
curl -X POST https://api.moonshot.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kimi-k2.5",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Switching Providers

Just update the environment variables and restart:

```bash
# Update .env file
# Then reload extension or restart Edge Functions
```

## Troubleshooting

**Error: 401 Unauthorized**
- Check API key is correct
- Verify key has not expired

**Error: 404 Model not found**
- Verify model name is correct for the provider
- Check provider's model documentation

**Slow responses**
- Try a faster model (gpt-4o-mini instead of gpt-4o)
- Check your internet connection
- Consider local models for offline operation

## Embedding Models

For vector search (product matching), the Edge Function uses OpenAI embeddings by default:

```typescript
// In analyze-conversation/index.ts
const response = await fetch("https://api.openai.com/v1/embeddings", {...})
```

To use Moonshot embeddings (if available):
- Update the embedding API endpoint in the Edge Function
- Or use a local embedding model for complete privacy
