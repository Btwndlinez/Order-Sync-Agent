// Supabase Edge Function: create-checkout
// Order Sync Agent Revenue Wedge - Creates Stripe checkout sessions with Usage Gates

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plan limits configuration
const PLAN_LIMITS = {
    starter: 20,
    pro: 200,
    scale: 1000
};

interface CheckoutRequest {
    variant_id: string;
    quantity: number;
    price: number;
    product_title: string;
    seller_id: string;
    customer_email?: string;
    success_url?: string;
    cancel_url?: string;
}

interface StripeLineItem {
    price_data: {
        currency: string;
        product_data: {
            name: string;
        };
        unit_amount: number;
    };
    quantity: number;
}

/**
 * Check usage limits for a seller
 */
async function checkUsageLimits(supabase: any, sellerId: string) {
    // Get current usage status using RPC
    const { data: usageStatus, error: usageError } = await supabase
        .rpc('get_usage_status', { p_seller_id: sellerId });

    if (usageError) {
        console.error('Error checking usage:', usageError);
        throw new Error('Failed to check usage limits');
    }

    if (!usageStatus || usageStatus.length === 0) {
        throw new Error('Seller not found');
    }

    const status = usageStatus[0];

    return {
        canCreate: status.can_create_link,
        plan: status.plan,
        used: status.links_used,
        limit: status.links_limit,
        remaining: status.links_remaining
    };
}

/**
 * Increment usage counter after successful checkout creation
 */
async function incrementUsage(supabase: any, sellerId: string, metadata: any) {
    const { data, error } = await supabase
        .rpc('increment_usage', {
            p_seller_id: sellerId,
            p_metadata: metadata
        });

    if (error) {
        console.error('Error incrementing usage:', error);
        // Don't throw - checkout already created, just log the error
        return null;
    }

    return data;
}

/**
 * Create a Stripe checkout session
 */
async function createStripeCheckoutSession(
    stripeSecretKey: string,
    lineItems: StripeLineItem[],
    successUrl: string,
    cancelUrl: string,
    customerEmail?: string
) {
    const requestBody: any = {
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
    };

    if (customerEmail) {
        requestBody.customer_email = customerEmail;
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            ...flattenObject(requestBody),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Stripe API error: ${response.status} - ${error}`);
    }

    return await response.json();
}

/**
 * Helper to flatten nested objects for Stripe's form encoding
 */
function flattenObject(obj: any, prefix = ""): Record<string, string> {
    return Object.keys(obj).reduce((acc: Record<string, string>, key: string) => {
        const pre = prefix.length ? prefix + "[" + key + "]" : key;
        if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(acc, flattenObject(obj[key], pre));
        } else if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any, index: number) => {
                Object.assign(acc, flattenObject(item, pre + "[" + index + "]"));
            });
        } else {
            acc[pre] = String(obj[key]);
        }
        return acc;
    }, {});
}

/**
 * Main request handler
 */
serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json() as CheckoutRequest;

        // Validate input
        if (!body.variant_id) {
            throw new Error("variant_id is required");
        }

        if (!body.price || body.price <= 0) {
            throw new Error("price must be greater than 0");
        }

        if (!body.quantity || body.quantity < 1) {
            throw new Error("quantity must be at least 1");
        }

        if (!body.seller_id) {
            throw new Error("seller_id is required");
        }

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // ============================================
        // USAGE GATE: Check limits before creating checkout
        // ============================================
        const usageCheck = await checkUsageLimits(supabase, body.seller_id);

        if (!usageCheck.canCreate) {
            // Return 403 with upgrade message
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "limit_reached",
                    message: "🎯 Goal Reached! You've generated 20 links this month. Ready to scale to 200?",
                    upgrade_url: `/upgrade?from=${usageCheck.plan}&used=${usageCheck.used}`,
                    current_plan: usageCheck.plan,
                    used: usageCheck.used,
                    limit: usageCheck.limit,
                    tier_info: {
                        starter: { limit: 20, price: 19 },
                        pro: { limit: 200, price: 49 },
                        scale: { limit: 1000, price: 149 }
                    }
                }),
                {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Get Stripe credentials
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

        if (!stripeSecretKey) {
            throw new Error("STRIPE_SECRET_KEY not configured");
        }

        // Convert price to cents for Stripe
        const priceInCents = Math.round(body.price * 100);

        // Create line items
        const lineItems: StripeLineItem[] = [{
            price_data: {
                currency: "usd",
                product_data: {
                    name: body.product_title || "Product",
                },
                unit_amount: priceInCents,
            },
            quantity: body.quantity,
        }];

        // Default success/cancel URLs
        const successUrl = body.success_url || "https://messenger.com";
        const cancelUrl = body.cancel_url || "https://messenger.com";

        // Create the Stripe checkout session
        const session = await createStripeCheckoutSession(
            stripeSecretKey,
            lineItems,
            successUrl,
            cancelUrl,
            body.customer_email
        );

        // ============================================
        // INCREMENT USAGE after successful creation
        // ============================================
        const newUsage = await incrementUsage(supabase, body.seller_id, {
            variant_id: body.variant_id,
            product_title: body.product_title,
            quantity: body.quantity,
            stripe_session_id: session.id
        });

        // Calculate remaining links
        const remaining = newUsage ? newUsage.remaining : usageCheck.remaining - 1;

        return new Response(
            JSON.stringify({
                success: true,
                checkout_url: session.url,
                session_id: session.id,
                variant_id: body.variant_id,
                quantity: body.quantity,
                total_amount: body.price * body.quantity,
                usage: {
                    plan: usageCheck.plan,
                    used: (newUsage?.new_count || usageCheck.used + 1),
                    limit: usageCheck.limit,
                    remaining: remaining,
                    nearly_full: remaining <= 5
                }
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("Checkout creation error:", error);

        // Check if it's a usage limit error
        if (error.message && error.message.includes('Usage limit exceeded')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "limit_reached",
                    message: "🎯 Goal Reached! You've hit your monthly limit. Upgrade to send more links!",
                    upgrade_url: "/upgrade"
                }),
                {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
