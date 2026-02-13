// Supabase Edge Function: log-shadow-result
// Shadow Mode Accuracy Tracking Endpoint

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// TYPES
// ============================================================================

interface ShadowLogRequest {
    message_text: string;
    ai_suggested_id: string | null;
    ai_confidence: number;
    human_selected_id: string;
    is_match: boolean;
    urgency_score?: number;
    budget_signal?: string;
    explanation?: string;
    seller_id?: string;
    conversation_id?: string;
}

interface AccuracyMetrics {
    total_comparisons: number;
    correct_matches: number;
    accuracy_percentage: number;
    high_confidence_accuracy?: number;
}

// ============================================================================
// ACCURACY CALCULATION
// ============================================================================

/**
 * Calculate rolling accuracy metrics
 */
async function calculateAccuracyMetrics(
    supabase: any,
    sellerId?: string
): Promise<AccuracyMetrics> {
    let query = supabase
        .from('category_suggestions')
        .select('*', { count: 'exact' })
        .eq('is_shadow', true)
        .not('human_selected_category_id', 'is', null);

    if (sellerId) {
        query = query.eq('seller_id', sellerId);
    }

    const { count: total, error: totalError } = await query;

    if (totalError) {
        console.error('Error calculating total:', totalError);
    }

    let matchQuery = supabase
        .from('category_suggestions')
        .select('*', { count: 'exact' })
        .eq('is_shadow', true)
        .eq('is_match', true);

    if (sellerId) {
        matchQuery = matchQuery.eq('seller_id', sellerId);
    }

    const { count: matches, error: matchError } = await matchQuery;

    if (matchError) {
        console.error('Error calculating matches:', matchError);
    }

    const totalCount = total || 0;
    const matchCount = matches || 0;

    return {
        total_comparisons: totalCount,
        correct_matches: matchCount,
        accuracy_percentage: totalCount > 0 
            ? Math.round((matchCount / totalCount) * 100) 
            : 0
    };
}

/**
 * Check if accuracy threshold is met for enabling suggestions
 */
async function checkAccuracyThreshold(
    supabase: any,
    threshold: number = 70
): Promise<{ threshold_met: boolean; current_accuracy: number }> {
    const metrics = await calculateAccuracyMetrics(supabase);
    
    // Need at least 20 samples before enabling
    if (metrics.total_comparisons < 20) {
        return {
            threshold_met: false,
            current_accuracy: metrics.accuracy_percentage
        };
    }

    return {
        threshold_met: metrics.accuracy_percentage >= threshold,
        current_accuracy: metrics.accuracy_percentage
    };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json() as ShadowLogRequest;

        // Validate required fields
        if (!body.message_text || !body.human_selected_id) {
            throw new Error("message_text and human_selected_id are required");
        }

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Update the existing shadow log with human selection
        const { data: updated, error: updateError } = await supabase
            .from('category_suggestions')
            .update({
                human_selected_category_id: body.human_selected_id,
                is_match: body.ai_suggested_id === body.human_selected_id,
                updated_at: new Date().toISOString()
            })
            .eq('message_text', body.message_text)
            .is('human_selected_category_id', null)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating shadow log:', updateError);
        }

        // Calculate current accuracy metrics
        const metrics = await calculateAccuracyMetrics(supabase, body.seller_id);
        const threshold = await checkAccuracyThreshold(supabase);

        // Log the comparison event
        console.log('🥒 Shadow Mode - Comparison logged:', {
            message: body.message_text.substring(0, 50) + '...',
            ai_suggested: body.ai_suggested_id,
            human_selected: body.human_selected_id,
            is_match: body.is_match,
            current_accuracy: `${metrics.accuracy_percentage}%`,
            threshold_met: threshold.threshold_met
        });

        // Trigger alert if accuracy drops below threshold
        if (metrics.total_comparisons >= 10 && metrics.accuracy_percentage < 60) {
            console.warn('⚠️ Accuracy below 60% - Shadow mode should remain active');
        }

        return new Response(
            JSON.stringify({
                success: true,
                logged: true,
                metrics: {
                    ...metrics,
                    threshold_met: threshold.threshold_met
                },
                recommendation: threshold.threshold_met 
                    ? "✅ Accuracy threshold met - Consider enabling suggestions"
                    : "🥒 Continue shadow mode - Accuracy below threshold"
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error('Log-shadow-result error:', error);
        
        return new Response(
            JSON.stringify({
                success: false,
                error: (error as Error).message
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
