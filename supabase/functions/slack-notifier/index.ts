// Supabase Edge Function: slack-notifier
// Crisis Alert System for Critical User Feedback

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// SLACK FORMATTER - Block Kit Message Builder
// ============================================================================

interface FeedbackData {
    id: string;
    user_id: string;
    rating: number;
    message: string;
    page?: string;
    metadata?: Record<string, any>;
    created_at: string;
}

interface SlackBlock {
    type: string;
    [key: string]: any;
}

/**
 * Build Slack Block Kit message for critical feedback
 */
function buildSlackMessage(feedback: FeedbackData): { blocks: SlackBlock[]; text: string } {
    const formattedTime = new Date(feedback.created_at).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const blocks: SlackBlock[] = [
        // Header Section
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "🚨 Critical Feedback Received",
                emoji: true
            }
        },
        // Divider
        {
            type: "divider"
        },
        // Context Section
        {
            type: "section",
            fields: [
                {
                    type: "mrkdwn",
                    text: `*User ID:*\n\`${feedback.user_id}\``
                },
                {
                    type: "mrkdwn",
                    text: `*Rating:*\n${'⭐'.repeat(feedback.rating)} (${feedback.rating}/5)`
                },
                {
                    type: "mrkdwn",
                    text: `*Page:*\n${feedback.page || 'N/A'}`
                },
                {
                    type: "mrkdwn",
                    text: `*Time:*\n${formattedTime} EST`
                }
            ]
        },
        // Feedback Message
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Feedback Message:*\n>${feedback.message.replace(/\n/g, '\n>')}`
            }
        }
    ];

    // Add metadata if present
    if (feedback.metadata && Object.keys(feedback.metadata).length > 0) {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Additional Context:*\n\`\`\`${JSON.stringify(feedback.metadata, null, 2)}\`\`\``
            }
        });
    }

    // Add action buttons
    blocks.push(
        { type: "divider" },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "🔍 Open Lead in Admin",
                        emoji: true
                    },
                    url: `${Deno.env.get("ADMIN_DASHBOARD_URL") || "https://admin.ordersyncagent.com"}/leads/${feedback.user_id}`,
                    action_id: "open_lead"
                },
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "📧 Reply to User",
                        emoji: true
                    },
                    url: `mailto:${feedback.metadata?.email || ''}?subject=Re: Your Feedback`,
                    action_id: "reply_user"
                },
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "✅ Mark as Resolved",
                        emoji: true
                    },
                    style: "primary",
                    action_id: "mark_resolved",
                    value: feedback.id
                }
            ]
        }
    );

    // Fallback text for notifications
    const text = `🚨 Critical Feedback: User ${feedback.user_id} rated ${feedback.rating}/5 - "${feedback.message.substring(0, 100)}${feedback.message.length > 100 ? '...' : ''}"`;

    return { blocks, text };
}

/**
 * Send notification to Slack webhook
 */
async function sendSlackNotification(
    webhookUrl: string,
    feedback: FeedbackData
): Promise<void> {
    const { blocks, text } = buildSlackMessage(feedback);

    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text,
            blocks,
            unfurl_links: false
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack API error: ${response.status} - ${errorText}`);
    }
}

/**
 * Log notification to database for audit trail
 */
async function logNotification(
    supabase: any,
    feedbackId: string,
    status: 'sent' | 'failed',
    error?: string
): Promise<void> {
    await supabase.from('notification_logs').insert({
        feedback_id: feedbackId,
        channel: 'slack',
        status,
        error_message: error || null,
        created_at: new Date().toISOString()
    });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

interface SlackNotifierRequest {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    record: FeedbackData;
    schema: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get Slack webhook URL from environment
        const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
        
        if (!slackWebhookUrl) {
            throw new Error("SLACK_WEBHOOK_URL environment variable is required");
        }

        // Parse webhook payload from Supabase Database Webhook
        const payload = await req.json() as SlackNotifierRequest;

        // Validate payload
        if (!payload.record) {
            throw new Error("Invalid payload: missing record");
        }

        const feedback = payload.record;

        // Filter: Only process ratings <= 2 (critical feedback)
        if (feedback.rating > 2) {
            console.log(`Rating ${feedback.rating} > 2, skipping notification`);
            return new Response(
                JSON.stringify({ 
                    success: true, 
                    message: "Rating above threshold, no notification sent" 
                }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Initialize Supabase client for logging
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Send Slack notification
        try {
            await sendSlackNotification(slackWebhookUrl, feedback);
            
            // Log successful notification
            await logNotification(supabase, feedback.id, 'sent');
            
            console.log(`🚨 Slack notification sent for feedback ${feedback.id}`);

            return new Response(
                JSON.stringify({ 
                    success: true, 
                    message: "Slack notification sent",
                    feedback_id: feedback.id,
                    rating: feedback.rating
                }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );

        } catch (slackError) {
            // Log failed notification
            await logNotification(
                supabase, 
                feedback.id, 
                'failed', 
                (slackError as Error).message
            );
            
            throw slackError;
        }

    } catch (error) {
        console.error('Slack notifier error:', error);
        
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
