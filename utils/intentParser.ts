/**
 * Intent Parser Utility
 * Uses Gemini 1.5 Flash for lightweight intent extraction
 */

export interface ParsedOrder {
  product_name: string
  variant: string | null
  quantity: number
  price_mentioned: string | null
  confidence_score: number
}

export interface ParsedIntent {
  orders: ParsedOrder[]
  customer_intent: 'purchase' | 'inquiry' | 'shipping_update' | 'unknown'
}

const SYSTEM_PROMPT = `You are the Order Sync Agent Extraction Engine. Your goal is to convert messy chat messages into structured order data.

CONSTRAINTS:
1. ONLY output valid JSON.
2. If multiple products are mentioned, return an array of objects.
3. If information is missing (e.g., size), leave the value as null.
4. Normalize quantities to integers.

EXTRACTION SCHEMA:
{
  "orders": [
    {
      "product_name": string,
      "variant": string (size/color),
      "quantity": number,
      "price_mentioned": string or null,
      "confidence_score": 0.0-1.0
    }
  ],
  "customer_intent": "purchase" | "inquiry" | "shipping_update" | "unknown"
}

EXAMPLES:
Input: "yo i'll take two of those red vintage tees in large"
Output: {"orders": [{"product_name": "vintage tees", "variant": "red large", "quantity": 2, "price_mentioned": null, "confidence_score": 0.95}], "customer_intent": "purchase"}

Input: "how much for the hat?"
Output: {"orders": [{"product_name": "hat", "variant": null, "quantity": 1, "price_mentioned": null, "confidence_score": 0.8}], "customer_intent": "inquiry"}

Input: "do you have this in medium?"
Output: {"orders": [{"product_name": null, "variant": "medium", "quantity": 1, "price_mentioned": null, "confidence_score": 0.6}], "customer_intent": "inquiry"}`

/**
 * Parse customer message intent using Gemini 1.5 Flash
 */
export async function parseIntent(customerMessage: string): Promise<ParsedIntent> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  if (!apiKey) {
    console.warn('Gemini API key not found, using fallback parser')
    return fallbackParser(customerMessage)
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [
            {
              parts: [{ text: customerMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
            responseMimeType: 'application/json'
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract JSON from response
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) {
      throw new Error('No content in Gemini response')
    }

    // Parse the JSON response
    const parsed = JSON.parse(content)
    
    // Validate structure
    if (!parsed.orders || !Array.isArray(parsed.orders)) {
      throw new Error('Invalid response structure')
    }

    return parsed as ParsedIntent

  } catch (error) {
    console.error('Intent parsing error:', error)
    console.log('Falling back to local parser')
    return fallbackParser(customerMessage)
  }
}

/**
 * Fallback local parser when LLM is unavailable
 */
function fallbackParser(message: string): ParsedIntent {
  const lowerMsg = message.toLowerCase()
  
  // Extract quantity
  let quantity = 1
  const qtyMatch = message.match(/(\d+)\s*(?:x|pcs?|pieces?|items?)?/i)
  const wordQty = lowerMsg.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/)
  
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1])
  } else if (wordQty) {
    const wordMap: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10
    }
    quantity = wordMap[wordQty[1]] || 1
  }

  // Extract price
  const priceMatch = message.match(/\$?(\d+(?:\.\d{2})?)/)
  const price = priceMatch ? `$${priceMatch[1]}` : null

  // Extract product name
  let product = null
  const productPatterns = [
    /(?:take|want|need|buy|get|order)\s+(?:the|a|some)?\s*(?:\d+\s*)?(?:x?\s*)?(.+?)(?:\s+(?:in|for|at|with)\s|$)/i,
    /(?:those|these|that|this)\s+(.+?)(?:\s+(?:in|for|at|with)\s|$)/i,
  ]

  for (const pattern of productPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      product = match[1].trim()
      break
    }
  }

  // Extract variant (size, color)
  let variant = null
  const variantPatterns = [
    /\b(small|medium|large|xl|xxl|s|m|l)\b/gi,
    /\b(red|blue|green|black|white|yellow|pink|purple|orange|brown|gray|grey)\b/gi,
    /in\s+(?:size|color)?\s*(.+?)(?:\s|$)/i,
  ]

  const variants: string[] = []
  for (const pattern of variantPatterns) {
    const matches = message.match(pattern)
    if (matches) {
      variants.push(...matches)
    }
  }
  
  if (variants.length > 0) {
    variant = [...new Set(variants)].join(' ').toLowerCase()
  }

  // Determine intent
  let customerIntent: ParsedIntent['customer_intent'] = 'unknown'
  if (/\b(how much|price|cost)\b/i.test(lowerMsg)) {
    customerIntent = 'inquiry'
  } else if (/\b(take|want|need|buy|get|order)\b/i.test(lowerMsg)) {
    customerIntent = 'purchase'
  } else if (/\b(shipping|track|delivered|arrived)\b/i.test(lowerMsg)) {
    customerIntent = 'shipping_update'
  }

  return {
    orders: [{
      product_name: product || 'unknown',
      variant: variant,
      quantity: quantity,
      price_mentioned: price,
      confidence_score: product ? 0.75 : 0.5
    }],
    customer_intent: customerIntent
  }
}

export default parseIntent
