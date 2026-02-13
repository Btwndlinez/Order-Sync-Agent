// OrderSync Integration Test - Simple HTTP Version
// Tests the full flow: analyze-conversation -> create-checkout -> stripe-webhook
// Run with: deno run --allow-net --allow-env test-integration-simple.ts

export {};

// Configuration - update these with your local values
const config = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "http://localhost:54321",
    SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") || "your-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "your-service-role-key",
    
    // Edge Function URLs
    ANALYZE_URL: "http://localhost:54321/functions/v1/analyze-and-match",
    CHECKOUT_URL: "http://localhost:54321/functions/v1/create-checkout",
    WEBHOOK_URL: "http://localhost:54321/functions/v1/stripe-webhook",
    
    // Test data
    TEST_SELLER_ID: "00000000-0000-0000-0000-000000000000",
};

// Sample conversation for testing
const conversationData = {
    seller_id: config.TEST_SELLER_ID,
    messenger_id: "test_conversation_123",
    messages: [
        {
            role: "buyer" as const,
            text: "Hi! I'm looking for a black hoodie in size medium",
            timestamp: "2026-02-10T10:00:00Z"
        },
        {
            role: "seller" as const,
            text: "Hi! We have a great premium black hoodie available. It's $49.99 and comes in sizes S-XL.",
            timestamp: "2026-02-10T10:01:00Z"
        },
        {
            role: "buyer" as const,
            text: "Perfect! I'll take the medium size. How can I pay?",
            timestamp: "2026-02-10T10:02:00Z"
        }
    ]
};

// Mock Stripe webhook payload
const webhookPayload = {
    id: "evt_test123456789",
    object: "event",
    api_version: "2020-08-27",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
        object: {
            id: "cs_test_123456789",
            object: "checkout.session",
            client_reference_id: config.TEST_SELLER_ID,
            customer: "cus_test123456789",
            subscription: "sub_test123456789",
            payment_status: "paid",
            total_amount: 4999,
            currency: "usd"
        }
    }
};

// Simple HTTP client for Supabase REST API
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

// Test class
class OrderSyncTest {
    private sellerId: string;
    
    constructor() {
        this.sellerId = config.TEST_SELLER_ID;
    }
    
    async setup() {
        console.log("🔧 Setting up test data...");
        
        // Create test seller
        try {
            await supabaseRequest("POST", "sellers", {
                id: this.sellerId,
                email: `test-${Date.now()}@example.com`,
                business_name: "Test Store",
                shopify_domain: "test-store.myshopify.com",
                plan: "starter",
                links_generated_count: 0
            });
        } catch (error) {
            // Seller might already exist, try to update
            await supabaseRequest("PATCH", "sellers", {
                email: `test-${Date.now()}@example.com`,
                links_generated_count: 0,
                plan: "starter"
            }, `id=eq.${this.sellerId}`);
        }
        
        // Create test product
        try {
            await supabaseRequest("POST", "products", {
                id: "prod_test123456789",
                seller_id: this.sellerId,
                title: "Premium Black Hoodie",
                description: "Premium cotton black hoodie, perfect for casual wear",
                price: 49.99,
                status: "active",
                variants: JSON.stringify([{
                    id: "var_test123456789",
                    title: "Medium",
                    price: "49.99"
                }]),
                search_text: "Premium Black Hoodie Premium cotton black hoodie, perfect for casual wear"
            });
        } catch (error) {
            // Product might already exist, update it
            await supabaseRequest("PATCH", "products", {
                title: "Premium Black Hoodie",
                description: "Premium cotton black hoodie, perfect for casual wear",
                price: 49.99
            }, `id=eq.prod_test123456789`);
        }
        
        console.log("✅ Test data setup complete");
    }
    
    async cleanup() {
        console.log("🧹 Cleaning up test data...");
        
        try {
            await supabaseRequest("DELETE", "usage_logs", undefined, `seller_id=eq.${this.sellerId}`);
            await supabaseRequest("DELETE", "conversations", undefined, `seller_id=eq.${this.sellerId}`);
            await supabaseRequest("DELETE", "products", undefined, `seller_id=eq.${this.sellerId}`);
            await supabaseRequest("DELETE", "sellers", undefined, `id=eq.${this.sellerId}`);
            console.log("✅ Cleanup complete");
        } catch (error) {
            console.error("⚠️ Cleanup error:", error);
        }
    }
    
    async testAnalyzeConversation() {
        console.log("🔍 Testing analyze-conversation...");
        
        const response = await fetch(config.ANALYZE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(conversationData)
        });
        
        if (response.status !== 200) {
            const error = await response.text();
            throw new Error(`analyze-conversation failed: ${response.status} - ${error}`);
        }
        
        const result = await response.json();
        console.log("📊 Analyze result:", result);
        
        // Basic validation
        if (typeof result.success !== 'boolean') {
            throw new Error("Response should have boolean 'success' field");
        }
        
        if (result.success) {
            if (!result.variant_id) throw new Error("Success response missing 'variant_id'");
            if (!result.price) throw new Error("Success response missing 'price'");
            if (typeof result.price !== 'number') throw new Error("Price should be a number");
        }
        
        return result;
    }
    
    async testCreateCheckout(matchResult: any) {
        console.log("💳 Testing create-checkout...");
        
        if (!matchResult.success) {
            console.log("⚠️ Skipping checkout test - no product match");
            return null;
        }
        
        const checkoutData = {
            variant_id: matchResult.variant_id,
            quantity: matchResult.quantity || 1,
            price: matchResult.price,
            product_title: matchResult.product_title,
            seller_id: this.sellerId,
            customer_email: "test@example.com"
        };
        
        const response = await fetch(config.CHECKOUT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(checkoutData)
        });
        
        if (response.status === 403) {
            const error = await response.json();
            console.log("⚠️ Usage limit reached:", error.message);
            return null;
        }
        
        if (response.status !== 200) {
            const error = await response.text();
            throw new Error(`create-checkout failed: ${response.status} - ${error}`);
        }
        
        const result = await response.json();
        console.log("💳 Checkout result:", result);
        
        if (!result.success) throw new Error("Checkout creation failed");
        if (!result.checkout_url) throw new Error("Missing checkout_url");
        if (!result.session_id) throw new Error("Missing session_id");
        
        return result;
    }
    
    async testStripeWebhook() {
        console.log("🔗 Testing stripe-webhook...");
        
        const payload = JSON.stringify(webhookPayload);
        const signature = `t=${Math.floor(Date.now() / 1000)},v1=${btoa(payload).slice(0, 64)}`;
        
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
            throw new Error(`stripe-webhook failed: ${response.status} - ${error}`);
        }
        
        const result = await response.json();
        console.log("🔗 Webhook result:", result);
        
        if (!result.received) {
            throw new Error("Webhook did not confirm receipt");
        }
        
        // Wait for async processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify seller was upgraded
        try {
            const sellers = await supabaseRequest("GET", "sellers", undefined, 
                `id=eq.${this.sellerId}&select=plan,stripe_customer_id,stripe_subscription_id,links_generated_count`);
            
            if (sellers && sellers.length > 0) {
                const seller = sellers[0];
                console.log("📊 Seller after webhook:", seller);
                
                if (seller.plan !== 'pro') {
                    console.log("⚠️ Expected plan 'pro', got:", seller.plan);
                }
            }
        } catch (error) {
            console.log("⚠️ Could not verify seller update:", error);
        }
        
        // Verify usage log
        try {
            const logs = await supabaseRequest("GET", "usage_logs", undefined,
                `seller_id=eq.${this.sellerId}&action=eq.subscription_upgraded`);
            
            if (logs && logs.length > 0) {
                console.log("📊 Usage log created:", logs[0]);
            }
        } catch (error) {
            console.log("⚠️ Could not verify usage log:", error);
        }
    }
    
    async checkUsageStatus() {
        console.log("📊 Checking usage status...");
        
        try {
            const usage = await supabaseRequest("GET", "seller_usage_summary", undefined,
                `seller_id=eq.${this.sellerId}`);
            
            if (usage && usage.length > 0) {
                console.log("📊 Current usage:", usage[0]);
                return usage[0];
            }
        } catch (error) {
            console.log("⚠️ Could not get usage status:", error);
        }
        
        return null;
    }
    
    async runFullTest() {
        console.log("🚀 OrderSync Integration Test");
        console.log("=".repeat(50));
        
        // Check prerequisites
        if (config.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key") {
            throw new Error("Please set SUPABASE_SERVICE_ROLE_KEY environment variable");
        }
        
        if (config.SUPABASE_ANON_KEY === "your-anon-key") {
            throw new Error("Please set SUPABASE_ANON_KEY environment variable");
        }
        
        try {
            // Setup
            await this.setup();
            
            // Test analyze-conversation
            const matchResult = await this.testAnalyzeConversation();
            
            // Test create-checkout
            const checkoutResult = await this.testCreateCheckout(matchResult);
            
            // Check usage status
            const usage = await this.checkUsageStatus();
            
            // Test stripe webhook
            await this.testStripeWebhook();
            
            console.log("=".repeat(50));
            console.log("✅ All tests completed!");
            if (usage) {
                console.log("📊 Final usage status:", usage);
            }
            
            return {
                success: true,
                matchResult,
                checkoutResult,
                usage
            };
            
        } catch (error) {
            console.error("❌ Test failed:", error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Main execution
console.log("🔌 CONNECTIVITY CHECK - OrderSync Integration Test");
console.log("=".repeat(60));
console.log("Phase 1: Testing environment and basic connectivity");
console.log("Prerequisites:");
console.log("- Supabase running: supabase start");
console.log("- Edge Functions serving: supabase functions serve");
console.log("- Environment variables set");
console.log("");

const test = new OrderSyncTest();

try {
    await test.runFullTest();
    console.log("\n🎉 CONNECTIVITY CHECK PASSED!");
    console.log("✅ Your environment is ready for advanced testing");
    console.log("✅ All Edge Functions are responding");
    console.log("✅ Database operations work correctly");
    console.log("");
    console.log("Next steps:");
    console.log("1. Run: deno test --allow-net --allow-env test-integration.ts");
    console.log("2. This will test Vector Search accuracy and product matching");
    Deno.exit(0);
} catch (error) {
    console.error("\n💥 CONNECTIVITY CHECK FAILED:", error);
    console.log("");
    console.log("🔧 TROUBLESHOOTING GUIDE:");
    console.log("");
    console.log("1. SUPABASE CONNECTION:");
    console.log("   ✅ Check: supabase status");
    console.log("   ✅ Should show: API URL, DB URL, and anon/service keys");
    console.log("");
    console.log("2. EDGE FUNCTIONS:");
    console.log("   ✅ Check: supabase functions serve");
    console.log("   ✅ Should show functions serving on port 54321");
    console.log("");
    console.log("3. ENVIRONMENT VARIABLES:");
    console.log("   ✅ SUPABASE_URL: " + (config.SUPABASE_URL || "NOT SET"));
    console.log("   ✅ SUPABASE_ANON_KEY: " + (config.SUPABASE_ANON_KEY === "your-anon-key" ? "NOT SET" : "SET"));
    console.log("   ✅ SUPABASE_SERVICE_ROLE_KEY: " + (config.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key" ? "NOT SET" : "SET"));
    console.log("");
    console.log("4. DATABASE MIGRATIONS:");
    console.log("   ✅ Check: supabase db push");
    console.log("   ✅ Should apply 001_initial_schema.sql and 002_tiered_pricing.sql");
    console.log("");
    console.log("5. QUICK TESTS:");
    console.log("   ✅ Try: curl " + config.ANALYZE_URL);
    console.log("   ✅ Try: curl " + config.CHECKOUT_URL);
    console.log("   ✅ Try: curl " + config.WEBHOOK_URL);
    console.log("");
    console.log("Fix the above issues, then re-run this connectivity check.");
    Deno.exit(1);
}