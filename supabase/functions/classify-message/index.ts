import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CategoryMatch {
  id: string
  name: string
  parent_id: string | null
  description: string | null
  keywords: string[] | null
  similarity: number
}

interface CategoryResult {
  id: string
  name: string
  parent: string | null
  confidence: number
  description: string | null
  keywords: string[] | null
}

serve(async (req: Request): Promise<Response> => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    const { message_text } = await req.json()

    if (!message_text || typeof message_text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'message_text is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Generate embedding from message text
    let embedding: number[] = []

    if (openaiApiKey) {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: message_text.substring(0, 8000), // Limit input length
        }),
      })

      if (!embeddingResponse.ok) {
        const err = await embeddingResponse.text()
        console.error('OpenAI embedding error:', err)
        throw new Error('Failed to generate embedding')
      }

      const embeddingData = await embeddingResponse.json()
      embedding = embeddingData.data[0].embedding
    } else {
      // Fallback: Use simple keyword matching if no API key
      console.warn('OPENAI_API_KEY not set, using keyword fallback')
      
      // Get all categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, parent_id, description, keywords')
        .limit(10)

      if (catError) throw catError

      const messageLower = message_text.toLowerCase()
      const keywordMatches = (categories || []).map((cat: any) => {
        let score = 0
        if (cat.keywords) {
          for (const kw of cat.keywords) {
            if (messageLower.includes(kw.toLowerCase())) {
              score += 1
            }
          }
        }
        return {
          ...cat,
          similarity: score > 0 ? Math.min(score / 3, 1) : 0
        }
      }).filter((c: any) => c.similarity > 0)
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, 3)

      return new Response(
        JSON.stringify({
          message_text,
          matches: keywordMatches,
          method: 'keyword_fallback'
        }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      )
    }

    // Step 2: Perform similarity search via RPC
    const { data: matches, error: rpcError } = await supabase.rpc('match_categories', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3
    })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      throw rpcError
    }

    // Step 3: Calculate confidence scores
    const results = (matches || []).map((match: CategoryMatch) => ({
      id: match.id,
      name: match.name,
      parent: match.parent_id,
      confidence: Math.round(match.similarity * 100) / 100,
      description: match.description,
      keywords: match.keywords
    }))

    return new Response(
      JSON.stringify({
        message_text,
        matches: results,
        method: 'embedding_similarity'
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
})
