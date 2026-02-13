// Supabase Edge Function: create-subscription-session
// Creates Stripe checkout session for Order Sync Agent Pro subscription ($19/month)
// Passes auth.uid() as client_reference_id for webhook tracking

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration - should be set via Supabase secrets
const PRO_PLAN_PRICE_ID = Deno.env.get("PRO_PLAN_PRICE_ID");
const STRIPE_SUCCESS_URL = Deno.env.get("STRIPE_SUCCESS_URL") || "https://messenger.com";
const STRIPE_CANCEL_URL = Deno.env.get("STRIPE_CANCEL_URL") || "https://messenger.com";

interface SubscriptionRequest {
    customer_email?: string;
}

interface StripeSession {
    id: string;
    url: string;
    client_reference_id: string;
    customer: string;
    subscription: string;
}

/**
 * Create a Stripe checkout session for the Pro subscription
 */
async function createStripeSubscriptionSession(
    stripeSecretKey: string,
    clientReferenceId: string,
    customerEmail?: string
): Promise<{ id: string; url: string; client_reference_id: string; customer: string; subscription: string }> {
    if (!PRO_PLAN_PRICE_ID) {
        throw new Error("PRO_PLAN_PRICE_ID not configured");
    }

    const requestBody: any = {
        payment_method_types: ["card"],
        line_items: [{
            price: PRO_PLAN_PRICE_ID,
            quantity: 1,
        }],
        mode: "subscription",
        success_url: STRIPE_SUCCESS_URL,
        cancel_url: STRIPE_CANCEL_URL,
        client_reference_id: clientReferenceId,
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
        body: new URLSearchParams(flattenObject(requestBody)),
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
serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const body = await req.json() as SubscriptionRequest;

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error("Authentication required");
        }

        const userId = user.id;

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            throw new Error("STRIPE_SECRET_KEY not configured");
        }

        const session = await createStripeSubscriptionSession(
            stripeSecretKey,
            userId,
            body.customer_email
        );

        return new Response(
            JSON.stringify({
                success: true,
                checkout_url: session.url,
                session_id: session.id,
                client_reference_id: session.client_reference_id,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error) {
        console.error("Subscription creation error:", error);
        
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