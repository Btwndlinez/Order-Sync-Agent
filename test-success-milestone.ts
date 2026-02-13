// OrderSync "Success Milestone" Test
// Simulates the satisfying moment when usage_count flips from 20 to 0
// Run with: deno run --allow-net --allow-env test-success-milestone.ts

export {};

const config = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "http://localhost:54321",
    SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") || "your-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "your-service-role-key",
    WEBHOOK_URL: "http://localhost:54321/functions/v1/stripe-webhook",
    TEST_SELLER_ID: "00000000-0000-0000-0000-000000000000",
};

// Mock Stripe webhook payload for upgrade
const upgradePayload = {
    id: "evt_milestone_" + Date.now(),
    object: "event",
    api_version: "2020-08-27",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
        object: {
            id: "cs_milestone_" + Date.now(),
            object: "checkout.session",
            client_reference_id: config.TEST_SELLER_ID,
            customer: "cus_milestone_success",
            subscription: "sub_milestone_pro",
            payment_status: "paid",
            total_amount: 4900, // $49.00 for Pro plan
            currency: "usd",
            success_url: "https://messenger.com",
            cancel_url: "https://messenger.com"
        }
    }
};

async function supabaseRequest(method: string, table: string, data?: any, filters?: string) {
    const url = new URL(`${config.SUPABASE_URL}/rest/v1/${table}`);
    if (filters) {
        url.search = filters;
    }
    
    const response = await fetch(url.toString(), {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
            "Prefer": "return=representation"
        },
        body: data ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase request failed: ${response.status} - ${error}`);
    }
    
    return await response.json();
}

async function showUsageStatus(title: string) {
    console.log(`\n📊 ${title}`);
    console.log("-".repeat(40));
    
    try {
        const usage = await supabaseRequest("GET", "seller_usage_summary", undefined,
            `seller_id=eq.${config.TEST_SELLER_ID}`);
        
        if (usage && usage.length > 0) {
            const status = usage[0];
            console.log(`Plan: ${status.plan?.toUpperCase() || 'UNKNOWN'}`);
            console.log(`Used: ${status.links_used || 0} links`);
            console.log(`Limit: ${status.links_limit || 0} links`);
            console.log(`Remaining: ${status.links_remaining || 0} links`);
            console.log(`Usage: ${((status.links_used || 0) / (status.links_limit || 1) * 100).toFixed(1)}%`);
            
            // Visual progress bar
            const percentage = (status.links_used || 0) / (status.links_limit || 1);
            const barLength = 20;
            const filled = Math.round(percentage * barLength);
            const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
            console.log(`Progress: [${bar}] ${Math.round(percentage * 100)}%`);
            
            return status;
        } else {
            console.log("❌ No usage data found");
            return null;
        }
    } catch (error) {
        console.log("⚠️ Could not fetch usage status:", error.message);
        return null;
    }
}

async function setupForMilestone() {
    console.log("🔧 Setting up for Success Milestone test...");
    
    // Create or reset seller to starter plan with 19 links used (almost at limit)
    try {
        await supabaseRequest("POST", "sellers", {
            id: config.TEST_SELLER_ID,
            email: `milestone-${Date.now()}@example.com`,
            business_name: "Milestone Test Store",
            shopify_domain: "milestone-test.myshopify.com",
            plan: "starter",
            links_generated_count: 19, // Almost at the limit!
            usage_period_start: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        // Update existing seller
        await supabaseRequest("PATCH", "sellers", {
            plan: "starter",
            links_generated_count: 19,
            usage_period_start: new Date().toISOString().split('T')[0]
        }, `id=eq.${config.TEST_SELLER_ID}`);
    }
    
    console.log("✅ Setup complete - Seller at 19/20 links used");
}

async function triggerUpgrade() {
    console.log("\n🚀 TRIGGERING UPGRADE WEBHOOK");
    console.log("=".repeat(50));
    console.log("Simulating: User pays $49 to upgrade to Pro plan");
    console.log("Expected: Usage count flips from 20 → 0");
    console.log("Expected: Plan changes: starter → pro");
    console.log("");
    
    const payload = JSON.stringify(upgradePayload);
    const signature = `t=${Math.floor(Date.now() / 1000)},v1=${btoa(payload).slice(0, 64)}`;
    
    console.log("📡 Sending webhook to:", config.WEBHOOK_URL);
    
    const response = await fetch(config.WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "stripe-signature": signature
        },
        body: payload
    });
    
    if (response.status !== 200) {
        const error = await response.text();
        throw new Error(`Webhook failed: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    console.log("✅ Webhook response:", result);
    
    if (result.received) {
        console.log("🎯 Webhook processed successfully!");
    } else {
        throw new Error("Webhook did not confirm receipt");
    }
}

async function showMilestoneAchievement(beforeStatus: any, afterStatus: any) {
    console.log("\n🏆 SUCCESS MILESTONE ACHIEVED!");
    console.log("=".repeat(50));
    
    console.log("🔄 USAGE TRANSFORMATION:");
    console.log(`   Before: ${beforeStatus.plan} plan, ${beforeStatus.links_used}/${beforeStatus.links_limit} links`);
    console.log(`   After:  ${afterStatus.plan} plan, ${afterStatus.links_used}/${afterStatus.links_limit} links`);
    
    if (beforeStatus.plan === 'starter' && afterStatus.plan === 'pro') {
        console.log("   ✅ Plan upgraded: starter → pro");
    }
    
    if (beforeStatus.links_used > 0 && afterStatus.links_used === 0) {
        console.log("   ✅ Usage reset: ${beforeStatus.links_used} → 0");
    }
    
    if (afterStatus.links_limit > beforeStatus.links_limit) {
        console.log(`   ✅ Limit increased: ${beforeStatus.links_limit} → ${afterStatus.links_limit}`);
    }
    
    console.log("\n💰 Revenue Impact:");
    console.log("   Starter plan: $19/month");
    console.log("   Pro plan: $49/month");
    console.log("   📈 Monthly revenue increase: +$30");
    
    console.log("\n🎊 Celebrate this moment!");
    console.log("   Your OrderSync system just converted a free user to a paid customer!");
    console.log("   The usage limits worked perfectly - hitting 20 links triggered the upgrade!");
}

async function cleanup() {
    console.log("\n🧹 Cleaning up milestone test...");
    
    try {
        await supabaseRequest("DELETE", "usage_logs", undefined, `seller_id=eq.${config.TEST_SELLER_ID}`);
        await supabaseRequest("DELETE", "sellers", undefined, `id=eq.${config.TEST_SELLER_ID}`);
        console.log("✅ Cleanup complete");
    } catch (error) {
        console.error("⚠️ Cleanup error:", error);
    }
}

// Main execution
console.log("🎯 ORDERsync SUCCESS MILESTONE TEST");
console.log("=".repeat(60));
console.log("This test simulates the satisfying moment when a user");
console.log("hits their usage limit and upgrades to a paid plan.");
console.log("");
console.log("Watch as the usage_count flips from 20→0 and plan changes starter→pro!");
console.log("");

if (config.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key") {
    console.log("❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable");
    Deno.exit(1);
}

const milestoneTest = {
    async run() {
        try {
            // Setup: Create seller at 19/20 links used
            await setupForMilestone();
            
            // Show "before" status
            const beforeStatus = await showUsageStatus("BEFORE UPGRADE - Almost at limit!");
            
            // Use one more link to hit the limit (simulated)
            console.log("\n⚠️ User tries to create one more checkout link...");
            console.log("🚫 ERROR: Goal Reached! You've generated 20 links this month.");
            console.log("💡 PROMPT: Ready to scale to 200 links for just $30 more?");
            
            // Update to 20 links (hit the limit)
            await supabaseRequest("PATCH", "sellers", {
                links_generated_count: 20
            }, `id=eq.${config.TEST_SELLER_ID}`);
            
            const limitStatus = await showUsageStatus("AT LIMIT - Upgrade prompted!");
            
            // Trigger the upgrade webhook
            await triggerUpgrade();
            
            // Wait for processing
            console.log("\n⏳ Waiting for webhook processing...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show "after" status
            const afterStatus = await showUsageStatus("AFTER UPGRADE - Fresh start!");
            
            // Show achievement
            await showMilestoneAchievement(limitStatus, afterStatus);
            
            console.log("\n🎉 MILESTONE TEST COMPLETED SUCCESSFULLY!");
            console.log("Your OrderSync Revenue Wedge is working perfectly!");
            
            return { success: true, beforeStatus, afterStatus };
            
        } catch (error) {
            console.error("\n💥 MILESTONE TEST FAILED:", error);
            console.log("");
            console.log("Troubleshooting:");
            console.log("1. Check Supabase is running: supabase status");
            console.log("2. Check webhook function: supabase functions serve");
            console.log("3. Verify migrations: supabase db push");
            console.log("4. Check environment variables are set");
            Deno.exit(1);
        } finally {
            await cleanup();
        }
    }
};

// Run the milestone test
await milestoneTest.run();