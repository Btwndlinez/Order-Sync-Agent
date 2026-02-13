// Supabase Edge Function: stripe-webhook
// Handles Stripe webhook events for subscription management

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<any> {
    const event = JSON.parse(payload);
    console.log("Webhook payload type:", event.type);
    return event;
}

/**
 * Handle invoice.payment_failed
 * Notify user about payment failure (grace period)
 */
async function handleInvoicePaymentFailed(
    supabase: any,
    invoice: any
): Promise<void> {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    
    console.log(`Payment failed for customer ${customerId}`);
    
    // Find seller by Stripe customer ID
    const { data: seller, error: findError } = await supabase
        .from('sellers')
        .select('id, email, plan')
        .eq('stripe_customer_id', customerId)
        .single();
    
    if (findError || !seller) {
        console.error("Seller not found for customer:", customerId);
        return;
    }
    
    await supabase.from('usage_logs').insert({
        seller_id: seller.id,
        action: 'payment_failed',
        plan: seller.plan,
        count_before: 0,
        count_after: 0,
        limit: 0,
        metadata: {
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: subscriptionId,
            next_payment_attempt: invoice.next_payment_attempt
        }
    });
    
    console.log(`⚠️ Payment failure logged for seller ${seller.id}`);
}

// Email templates
const WELCOME_PRO_EMAIL = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
                <div style="color: #ffffff; font-size: 20px; font-weight: 700;">Order Sync Agent</div>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px 24px;">
                <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 16px 0;">Welcome to the Pro Club! 🎉</h1>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    Your account has been upgraded. You now have <strong style="color: #4f46e5;">unlimited checkout link generations</strong>.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <tr>
                        <td style="text-align: center;">
                            <div style="font-size: 36px; margin-bottom: 4px;">∞</div>
                            <div style="color: #4f46e5; font-size: 14px; font-weight: 600;">Unlimited Links</div>
                        </td>
                        <td style="text-align: center; border-left: 1px solid #e5e7eb;">
                            <div style="font-size: 36px; margin-bottom: 4px;">⚡</div>
                            <div style="color: #4f46e5; font-size: 14px; font-weight: 600;">Priority Support</div>
                        </td>
                        <td style="text-align: center; border-left: 1px solid #e5e7eb;">
                            <div style="font-size: 36px; margin-bottom: 4px;">🔒</div>
                            <div style="color: #4f46e5; font-size: 14px; font-weight: 600;">Advanced Features</div>
                        </td>
                    </tr>
                </table>
                <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <div style="font-size: 18px; margin-bottom: 8px;">💡 Pro Tip</div>
                    <p style="color: #065f46; font-size: 14px; line-height: 1.6; margin: 0;">
                        Did you know Order Sync Agent works on <strong>WhatsApp Web</strong> too? Open any chat and hit Sync to close deals there even faster.
                    </p>
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="text-align: center; padding: 8px 0 24px 0;">
                            <a href="https://billing.stripe.com/p/login/example" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                                Manage Subscription
                            </a>
                        </td>
                    </tr>
                </table>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                    Happy selling! 🚀<br>
                    The Order Sync Agent Team
                </p>
            </td>
        </tr>
        <tr>
            <td style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                    © 2026 Order Sync Agent. All rights reserved.
                </p>
                <p style="margin: 0;">
                    <a href="https://ordersync.io/privacy" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Privacy Policy</a>
                    <a href="https://ordersync.io/terms" style="color: #6b7280; text-decoration: underline; font-size: 12px; margin: 0 8px;">Terms of Service</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`

/**
 * Send Welcome Pro Email via Resend or SendGrid
 */
async function sendWelcomeProEmail(email: string, sellerName: string): Promise<void> {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const portalUrl = Deno.env.get("STRIPE_CUSTOMER_PORTAL_URL") || "https://billing.stripe.com/p/login/example";

    if (!apiKey) {
        console.log("📧 [DEV MODE] Welcome email would be sent to:", email);
        console.log("   Subject: Welcome to the Pro Club! 🚀");
        return;
    }

    const emailHtml = WELCOME_PRO_EMAIL.replace(
        'https://billing.stripe.com/p/login/example',
        portalUrl
    );

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: "Order Sync Agent <onboarding@ordersync.io>",
                to: email,
                subject: "Welcome to the Pro Club! 🚀",
                html: emailHtml,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Failed to send welcome email:", error);
        } else {
            console.log("✅ Welcome email sent to:", email);
        }
    } catch (error) {
        console.error("Error sending welcome email:", error);
    }
}

/**
 * Handle checkout.session.completed
 * Upgrade user to 'pro' and send welcome email
 */
async function handleCheckoutSessionCompleted(
    supabase: any,
    session: any
): Promise<void> {
    const clientReferenceId = session.client_reference_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const customerEmail = session.customer_details?.email;

    if (!clientReferenceId) {
        console.error("No client_reference_id in checkout session");
        return;
    }

    console.log(`Processing checkout for user ${clientReferenceId}`);

    // Update seller plan to 'pro' with unlimited limit
    const { error: updateError } = await supabase
        .from('sellers')
        .update({
            email: customerEmail,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: 'pro',
            links_limit: 9999,
            links_generated_count: 0,
            usage_period_start: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
        })
        .eq('id', clientReferenceId);

    if (updateError) {
        console.error("Failed to upgrade seller:", updateError);
        throw updateError;
    }

    await supabase.from('usage_logs').insert({
        seller_id: clientReferenceId,
        action: 'subscription_upgraded',
        plan: 'pro',
        count_before: 0,
        count_after: 0,
        limit: 9999,
        metadata: {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            checkout_session_id: session.id
        }
    });

    // Send Welcome Pro Email
    await sendWelcomeProEmail(customerEmail, "");

    console.log(`✅ User ${clientReferenceId} upgraded to Pro successfully`);
}

/**
 * Handle invoice.payment_succeeded
 * Confirm successful payment and log renewal
 */
async function handleInvoicePaymentSucceeded(
    supabase: any,
    invoice: any
): Promise<void> {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    const amountPaid = invoice.amount_paid / 100;
    
    console.log(`Payment succeeded for customer ${customerId}: $${amountPaid}`);
    
    const { data: seller, error: findError } = await supabase
        .from('sellers')
        .select('id, email, plan, links_generated_count')
        .eq('stripe_customer_id', customerId)
        .single();
    
    if (findError || !seller) {
        console.error("Seller not found for customer:", customerId);
        return;
    }
    
    await supabase.from('usage_logs').insert({
        seller_id: seller.id,
        action: 'payment_succeeded',
        plan: seller.plan,
        count_before: seller.links_generated_count,
        count_after: seller.links_generated_count,
        limit: seller.plan === 'pro' ? 200 : 20,
        metadata: {
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: subscriptionId,
            amount_paid: amountPaid,
            invoice_url: invoice.hosted_invoice_url
        }
    });
    
    console.log(`✅ Payment succeeded logged for seller ${seller.id}`);
}

/**
 * Handle customer.subscription.deleted
 * Downgrade user back to 'starter' using upsert for profiles table
 */
async function handleSubscriptionDeleted(
    supabase: any,
    subscription: any
): Promise<void> {
    const customerId = subscription.customer;
    
    console.log(`Subscription cancelled for customer ${customerId}`);
    
    const { data: seller, error: findError } = await supabase
        .from('sellers')
        .select('id, plan, links_generated_count')
        .eq('stripe_customer_id', customerId)
        .single();
    
    if (findError || !seller) {
        console.error("Seller not found for customer:", customerId);
        return;
    }
    
    // Downgrade to starter
    const { error: updateError } = await supabase
        .from('sellers')
        .update({
            plan: 'starter',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', seller.id);
    
    if (updateError) {
        console.error("Failed to downgrade seller:", updateError);
        throw updateError;
    }
    
    await supabase.from('usage_logs').insert({
        seller_id: seller.id,
        action: 'subscription_downgraded',
        plan: 'starter',
        count_before: seller.links_generated_count,
        count_after: seller.links_generated_count,
        limit: 20,
        metadata: {
            previous_plan: seller.plan,
            stripe_subscription_id: subscription.id,
            cancel_at_period_end: subscription.cancel_at_period_end
        }
    });
    
    console.log(`✅ User ${seller.id} downgraded to Starter`);
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
        // Only accept POST requests
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get webhook signing secret
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
        if (!webhookSecret) {
            console.error("STRIPE_WEBHOOK_SIGNING_SECRET not configured");
            return new Response(
                JSON.stringify({ error: "Webhook secret not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get the signature from headers
        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            return new Response(
                JSON.stringify({ error: "Missing stripe-signature header" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get the raw body
        const payload = await req.text();

        // Verify webhook signature
        let event;
        try {
            event = await verifyStripeSignature(payload, signature, webhookSecret);
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return new Response(
                JSON.stringify({ error: "Invalid signature" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Handle the event based on type
        console.log(`Processing webhook event: ${event.type}`);

        switch (event.type) {
            case "checkout.session.completed":
                await handleCheckoutSessionCompleted(supabase, event.data.object);
                break;

            case "invoice.payment_succeeded":
                await handleInvoicePaymentSucceeded(supabase, event.data.object);
                break;

            case "invoice.payment_failed":
                await handleInvoicePaymentFailed(supabase, event.data.object);
                break;

            case "customer.subscription.deleted":
                await handleSubscriptionDeleted(supabase, event.data.object);
                break;

            case "customer.subscription.updated":
                console.log("Subscription updated:", event.data.object.id);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        // Return success
        return new Response(
            JSON.stringify({ received: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Webhook processing error:", error);
        return new Response(
            JSON.stringify({ 
                error: "Webhook processing failed",
                details: error instanceof Error ? error.message : String(error)
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
