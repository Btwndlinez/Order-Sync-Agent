// Supabase Edge Function: suggest-category
// Antigravity Intent Scoring & Urgency Extraction System

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// URGENCY SCORER - Regex-based heuristic overlay
// ============================================================================

interface UrgencyScore {
    score: number; // 1-10
    priority: 'high' | 'medium' | 'low';
    signals: string[];
}

interface BudgetSignal {
    level: 'low' | 'high' | 'unknown';
    indicators: string[];
}

// Priority 1 (High Urgency) - Score 8-10
const HIGH_URGENCY_PATTERNS = [
    { pattern: /\b(asap|a\.s\.a\.p)\b/gi, weight: 2, label: "asap" },
    { pattern: /\b(emergency|urgent|urgently)\b/gi, weight: 3, label: "emergency" },
    { pattern: /\b(now|right now|immediately)\b/gi, weight: 3, label: "now" },
    { pattern: /\b(today|tonight|this morning|this afternoon)\b/gi, weight: 2, label: "today" },
    { pattern: /!!+/g, weight: 1, label: "multiple exclamation" },
    { pattern: /\b(water everywhere|flooding|fire|burning|smoking)\b/gi, weight: 3, label: "crisis" },
    { pattern: /\b(leaking|burst|broken pipe|sewage)\b/gi, weight: 2, label: "damage" },
    { pattern: /\b(help|please help|need help)\b/gi, weight: 1, label: "plea" },
];

// Priority 2 (Medium Urgency) - Score 4-7
const MEDIUM_URGENCY_PATTERNS = [
    { pattern: /\b(this week|within (a )?week)\b/gi, weight: 1, label: "this week" },
    { pattern: /\b(quote|pricing|price|how much|cost)\b/gi, weight: 1, label: "pricing" },
    { pattern: /\b(estimate|quote me|give me a price)\b/gi, weight: 1, label: "estimate" },
    { pattern: /\b(soon|quickly|fast)\b/gi, weight: 1, label: "speed" },
];

// Priority 3 (Low Urgency) - Score 1-3
const LOW_URGENCY_PATTERNS = [
    { pattern: /\b(next month|in a month|monthly)\b/gi, weight: -2, label: "next month" },
    { pattern: /\b(planning|future|eventually|someday)\b/gi, weight: -2, label: "planning" },
    { pattern: /\b(just looking|browsing|curious|wondering)\b/gi, weight: -2, label: "browsing" },
    { pattern: /\b(no rush|take your time|whenever)\b/gi, weight: -3, label: "no rush" },
];

// Budget signal patterns
const HIGH_BUDGET_PATTERNS = [
    { pattern: /\b(price no object|money no object|unlimited budget)\b/gi, label: "unlimited budget" },
    { pattern: /\b(premium|best quality|top tier|luxury|high-end)\b/gi, label: "premium" },
    { pattern: /\b(urgent|asap|emergency)\b/gi, label: "urgent timeline" },
    { pattern: /\b(whatever it takes|just get it done)\b/gi, label: "urgent tone" },
];

const LOW_BUDGET_PATTERNS = [
    { pattern: /\b(cheap|cheapest|budget|affordable|low cost)\b/gi, label: "budget" },
    { pattern: /\b(discount|coupon|deal|sale|promo)\b/gi, label: "discount" },
    { pattern: /\b(student|senior|military discount)\b/gi, label: "discount request" },
];

/**
 * Calculate urgency score based on regex patterns
 */
function calculateUrgency(text: string): UrgencyScore {
    let score = 5; // Start at neutral (5/10)
    const signals: string[] = [];

    // Check high urgency patterns
    for (const { pattern, weight, label } of HIGH_URGENCY_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            score += weight * matches.length;
            signals.push(label);
        }
    }

    // Check medium urgency patterns
    for (const { pattern, weight, label } of MEDIUM_URGENCY_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            score += weight * matches.length;
            signals.push(label);
        }
    }

    // Check low urgency patterns (reduce score)
    for (const { pattern, weight, label } of LOW_URGENCY_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            score += weight * matches.length;
            signals.push(label);
        }
    }

    // Clamp score between 1 and 10
    score = Math.max(1, Math.min(10, score));

    // Determine priority level
    let priority: 'high' | 'medium' | 'low';
    if (score >= 8) {
        priority = 'high';
    } else if (score >= 4) {
        priority = 'medium';
    } else {
        priority = 'low';
    }

    return { score, priority, signals: [...new Set(signals)] };
}

/**
 * Detect budget signals from text
 */
function detectBudgetSignal(text: string): BudgetSignal {
    const indicators: string[] = [];

    // Check high budget indicators
    for (const { pattern, label } of HIGH_BUDGET_PATTERNS) {
        if (pattern.test(text)) {
            indicators.push(label);
        }
    }

    if (indicators.length > 0) {
        return { level: 'high', indicators };
    }

    // Check low budget indicators
    for (const { pattern, label } of LOW_BUDGET_PATTERNS) {
        if (pattern.test(text)) {
            indicators.push(label);
        }
    }

    if (indicators.length > 0) {
        return { level: 'low', indicators };
    }

    return { level: 'unknown', indicators: [] };
}

// ============================================================================
// EMBEDDING & VECTOR SEARCH
// ============================================================================

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
 * Search for similar intent anchors using vector similarity
 */
async function findIntentAnchors(
    supabase: any,
    embedding: number[],
    threshold: number = 0.7
): Promise<{ name: string; confidence: number; terms: string[] }[]> {
    const { data: anchors, error } = await supabase
        .rpc('find_intent_anchors_by_similarity', {
            p_embedding: embedding,
            p_threshold: threshold,
            p_limit: 5
        });

    if (error) {
        console.error('Intent anchor search error:', error);
        return [];
    }

    return anchors || [];
}

// ============================================================================
// CATEGORY MATCHING
// ============================================================================

/**
 * Find best matching category using vector similarity
 */
async function findBestCategory(
    supabase: any,
    embedding: number[],
    threshold: number = 0.75
): Promise<{ name: string; confidence: number; id: string } | null> {
    const { data: categories, error } = await supabase
        .rpc('find_categories_by_similarity', {
            p_embedding: embedding,
            p_threshold: threshold,
            p_limit: 1
        });

    if (error || !categories || categories.length === 0) {
        console.error('Category search error:', error);
        return null;
    }

    return {
        id: categories[0].id,
        name: categories[0].name,
        confidence: categories[0].similarity
    };
}

// ============================================================================
// EXPLANATION GENERATOR
// ============================================================================

/**
 * Generate human-readable explanation of the AI's reasoning
 */
function generateExplanation(
    category: { name: string; confidence: number } | null,
    urgency: UrgencyScore,
    budget: BudgetSignal
): string {
    const parts: string[] = [];

    // Category explanation
    if (category) {
        parts.push(`Detected category "${category.name}" with ${Math.round(category.confidence * 100)}% confidence.`);
    }

    // Urgency explanation
    if (urgency.signals.length > 0) {
        const signalText = urgency.signals.join("', '");
        parts.push(`Urgency level: ${urgency.priority} (${urgency.score}/10) due to '${signalText}'.`);
    } else {
        parts.push(`Urgency level: ${urgency.priority} (${urgency.score}/10).`);
    }

    // Budget explanation
    if (budget.level !== 'unknown') {
        parts.push(`${budget.level === 'high' ? 'High' : 'Low'} budget signal detected.`);
    }

    return parts.join(' ');
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

interface SuggestCategoryRequest {
    message_text: string;
    seller_id?: string;
    conversation_id?: string;
}

interface IntelligenceResponse {
    category: {
        name: string;
        confidence: number;
        id?: string;
    } | null;
    intent: {
        urgency_score: number;
        priority: 'high' | 'medium' | 'low';
        budget_signal: 'low' | 'high' | 'unknown';
        matched_signals: string[];
    };
    explanation: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json() as SuggestCategoryRequest;

        if (!body.message_text || body.message_text.trim().length === 0) {
            throw new Error("message_text is required");
        }

        const messageText = body.message_text.toLowerCase();

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // STEP 1: Generate embedding for the message
        const embedding = await generateEmbedding(messageText);

        // STEP 2: Find best matching category using vector similarity
        const category = await findBestCategory(supabase, embedding);

        // STEP 3: Find intent anchors using vector similarity
        const intentAnchors = await findIntentAnchors(supabase, embedding);

        // STEP 4: Calculate urgency score using regex heuristics
        const urgency = calculateUrgency(messageText);

        // STEP 5: Detect budget signals
        const budget = detectBudgetSignal(messageText);

        // STEP 6: Generate explanation
        const explanation = generateExplanation(category, urgency, budget);

        // Build unified intelligence response
        const response: IntelligenceResponse = {
            category: category ? {
                name: category.name,
                confidence: category.confidence,
                id: category.id
            } : null,
            intent: {
                urgency_score: urgency.score,
                priority: urgency.priority,
                budget_signal: budget.level,
                matched_signals: urgency.signals
            },
            explanation
        };

        // Log for shadow mode (async, don't await)
        if (body.seller_id && body.conversation_id) {
            supabase.from('category_suggestions').insert({
                seller_id: body.seller_id,
                conversation_id: body.conversation_id,
                message_text: body.message_text,
                suggested_category_id: category?.id || null,
                ai_confidence: category?.confidence || 0,
                urgency_score: urgency.score,
                budget_signal: budget.level,
                intent_anchors_matched: intentAnchors.map(a => a.name),
                explanation,
                is_shadow: true,
                created_at: new Date().toISOString()
            }).then(({ error }) => {
                if (error) console.error('Failed to log suggestion:', error);
            });
        }

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error('Suggest-category error:', error);
        return new Response(
            JSON.stringify({
                error: (error as Error).message,
                category: null,
                intent: {
                    urgency_score: 5,
                    priority: 'medium',
                    budget_signal: 'unknown',
                    matched_signals: []
                },
                explanation: "Error processing request. Defaulting to neutral values."
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
