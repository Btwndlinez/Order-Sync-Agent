import type { Message, Product } from './types.ts';

/**
 * Format conversation messages for LLM input
 */
export function formatConversationForLLM(messages: Message[]): string {
  return messages
    .map(msg => {
      const role = msg.role || (msg.isSeller ? 'SELLER' : 'BUYER');
      return `${role.toUpperCase()}: ${msg.text}`;
    })
    .join('\n');
}

/**
 * Format product catalog for LLM input
 */
export function formatCatalogForLLM(products: Product[]): string {
  return JSON.stringify(products, null, 2);
}

/**
 * Build the full analysis prompt
 */
export function buildAnalysisPrompt(messages: Message[], catalog: Product[]): string {
  const conversationText = formatConversationForLLM(messages);
  const catalogText = formatCatalogForLLM(catalog);

  return SYSTEM_PROMPT
    .replace('{{MESSAGES}}', conversationText)
    .replace('{{SHOPIFY_PRODUCTS}}', catalogText);
}

/**
 * Core conversation analysis prompt
 */
export const SYSTEM_PROMPT = `<system>
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
</task>`;
