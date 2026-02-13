import type { AnalysisRequest, AnalysisResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:54321/functions/v1';

export async function analyzeConversation(request: AnalysisRequest): Promise<AnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function analyzeConversationLocal(request: AnalysisRequest): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simple mock implementation for demo
  const lastBuyerMessage = [...request.messages]
    .reverse()
    .find(m => m.role === 'buyer');
  
  const hasIntent = lastBuyerMessage && (
    lastBuyerMessage.text.toLowerCase().includes('take') ||
    lastBuyerMessage.text.toLowerCase().includes('get') ||
    lastBuyerMessage.text.toLowerCase().includes('buy')
  );

  if (!hasIntent || request.shopify_products.length === 0) {
    return {
      intent_detected: false,
      confidence: 0.2,
      product_id: null,
      variant_id: null,
      product_title: null,
      variant_title: null,
      quantity: 0,
      total_value: null,
      trigger_message: null,
      reasoning: 'No clear purchase intent detected in conversation.'
    };
  }

  const product = request.shopify_products[0];
  const variant = product.variants[0];
  
  return {
    intent_detected: true,
    confidence: 0.85,
    product_id: product.id,
    variant_id: variant?.id || null,
    product_title: product.title,
    variant_title: variant?.title || null,
    quantity: 1,
    total_value: variant ? parseFloat(variant.price) : null,
    trigger_message: lastBuyerMessage.text,
    reasoning: `Detected purchase intent: "${lastBuyerMessage.text}". Matched to ${product.title}.`
  };
}
