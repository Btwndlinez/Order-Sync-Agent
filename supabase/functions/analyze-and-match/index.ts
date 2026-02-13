// Supabase Edge Function: analyze-and-match
// OrderSync Revenue Wedge - Returns variant_id and price for Stripe checkout

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildAnalysisPrompt } from "../_shared/prompts.ts";
import type { AnalysisRequest, AnalysisResult, Message, Product } from "../_shared/types.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
 * Antigravity Fast-Path: Call LLM API
 */
async function callLLM(prompt: string): Promise<string> {
    const apiKey = Deno.env.get("LLM_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
    const baseUrl = Deno.env.get("LLM_BASE_URL") ?? "https://api.openai.com/v1";
    const model = Deno.env.get("LLM_MODEL") ?? "gpt-4o-mini";

    if (!apiKey) throw new Error("LLM_API_KEY is required");

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 512,
            temperature: 0,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) throw new Error(`LLM Error: ${response.status}`);

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Generate embedding for semantic search
 */
async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = Deno.env.get("LLM_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) throw new Error("API key required for embeddings");

    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Embedding API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

/**
 * Antigravity Layer 2: Fuzzy + Semantic Product Matching
 */
async function findMatchingProducts(
    supabase: any,
    sellerId: string,
    searchTerm: string,
    limit: number = 5
): Promise<any[]> {
    // Method 1: Fuzzy text search using PostgreSQL functions
    const { data: fuzzyMatches, error: fuzzyError } = await supabase
        .rpc('find_matching_products', {
            p_seller_id: sellerId,
            p_search_term: searchTerm,
            p_limit: limit
        });

    if (fuzzyError) {
        console.error('Fuzzy search error:', fuzzyError);
    }

    if (fuzzyMatches && fuzzyMatches.length > 0) {
        return fuzzyMatches;
    }

    // Method 2: Semantic search with embeddings (fallback)
    try {
        const embedding = await generateEmbedding(searchTerm);

        const { data: semanticMatches, error: semanticError } = await supabase
            .rpc('find_products_by_semantic_similarity', {
                p_seller_id: sellerId,
                p_embedding: embedding,
                p_limit: limit
            });

        if (semanticError) {
            console.error('Semantic search error:', semanticError);
            return [];
        }

        return semanticMatches || [];
    } catch (e) {
        console.error('Semantic search failed:', e);
        return [];
    }
}

function parseAnalysisResponse(responseText: string): AnalysisResult {
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
        const result = JSON.parse(cleanedText);
        return {
            intent_detected: !!result.intent_detected,
            confidence: result.confidence ?? 0,
            product_id: result.product_id ?? null,
            variant_id: result.variant_id ?? null,
            product_title: result.product_title ?? null,
            variant_title: result.variant_title ?? null,
            quantity: result.quantity ?? (result.intent_detected ? 1 : 0),
            total_value: result.total_value ?? null,
            trigger_message: result.trigger_message ?? null,
            reasoning: result.reasoning ?? "",
        };
    } catch (e) {
        throw new Error(`Parse Error: ${(e as Error).message}\nRaw: ${responseText}`);
    }
}

/**
 * OrderSync Revenue Wedge Response
 */
interface MatchResult {
    success: boolean;
    variant_id: string | null;
    price: number | null;
    quantity: number;
    product_title: string | null;
    confidence: number;
    checkout_ready: boolean;
    error?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const body = await req.json() as AnalysisRequest;

        if (!body.seller_id) {
            throw new Error("seller_id is required for product matching");
        }

        const messages = body.messages.slice(-20);

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // ANTIGRAVITY: LLM extracts intent and product name
        const llmResponse = await callLLM(buildAnalysisPrompt(messages, body.shopify_products || []));
        let result = parseAnalysisResponse(llmResponse);

        // ANTIGRAVITY LAYER 2: Database Product Matching
        if (result.intent_detected && result.product_title) {
            const matches = await findMatchingProducts(
                supabase,
                body.seller_id,
                result.product_title,
                5
            );

            if (matches && matches.length > 0) {
                const bestMatch = matches[0];

                // Merge database match with LLM result
                result.product_id = bestMatch.id;
                result.product_title = bestMatch.title;
                result.variant_id = bestMatch.variant_id;
                result.variant_title = bestMatch.variant_title;
                result.total_value = bestMatch.price * (result.quantity || 1);

                // Boost confidence on successful database match
                result.confidence = Math.min(1, result.confidence + 0.1);
                result.reasoning += ` [Matched to DB product: ${bestMatch.id}]`;

                // Return OrderSync Revenue Wedge format
                const matchResult: MatchResult = {
                    success: true,
                    variant_id: bestMatch.variant_id,
                    price: bestMatch.price,
                    quantity: result.quantity || 1,
                    product_title: bestMatch.title,
                    confidence: result.confidence,
                    checkout_ready: true
                };

                return new Response(JSON.stringify(matchResult), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } else {
                // No match found
                result.confidence = Math.max(0.3, result.confidence - 0.2);
                result.reasoning += " [WARNING: No matching product in catalog]";
            }
        }

        // Store conversation in database (async, don't await)
        if (body.messenger_id) {
            supabase.from('conversations').upsert({
                seller_id: body.seller_id,
                messenger_id: body.messenger_id,
                messages: messages,
                intent_detected: result.intent_detected,
                detected_product_id: result.product_id,
                detected_variant_id: result.variant_id,
                confidence_score: result.confidence,
                trigger_message: result.trigger_message,
                analysis_result: result,
            }, {
                onConflict: 'seller_id,messenger_id'
            }).then(({ error }) => {
                if (error) console.error('Failed to store conversation:', error);
            });
        }

        // Return unsuccessful match
        const matchResult: MatchResult = {
            success: false,
            variant_id: null,
            price: null,
            quantity: 0,
            product_title: null,
            confidence: result.confidence,
            checkout_ready: false
        };

        return new Response(JSON.stringify(matchResult), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        const errorResult: MatchResult = {
            success: false,
            variant_id: null,
            price: null,
            quantity: 0,
            product_title: null,
            confidence: 0,
            checkout_ready: false,
            error: (error as Error).message
        };

        return new Response(JSON.stringify(errorResult), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
