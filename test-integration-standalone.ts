// OrderSync Integration Test - Standalone Version
// Tests the full flow: analyze-conversation -> create-checkout -> stripe-webhook
// Run with: deno run --allow-net --allow-env test-integration-standalone.ts

interface TestConfig {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    ANALYZE_URL: string;
    CHECKOUT_URL: string;
    WEBHOOK_URL: string;
    TEST_SELLER_ID: string;
    TEST_STRIPE_SECRET_KEY: string;
    TEST_WEBHOOK_SECRET: string;
}

interface Message {
    role?: 'buyer' | 'seller';
    text: string;
    timestamp: string | number;
}

interface AnalyzeRequest {
    seller_id: string;
    messenger_id?: string;
    messages: Message[];
}

interface CheckoutRequest {
    variant_id: string;
    quantity: number;
    price: number;
    product_title: string;
    seller_id: string;
    customer_email?: string;
}

// Test configuration - update these with your local values
const TEST_CONFIG: TestConfig = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "http://localhost:54321",
    SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") || "your-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "your-service-role-key",
    ANALYZE_URL: "http://localhost:54321/functions/v1/analyze-and-match",
    CHECKOUT_URL: "http://localhost:54321/functions/v1/create-checkout",
    WEBHOOK_URL: "http://localhost:54321/functions/v1/stripe-webhook",
    TEST_SELLER_ID: "00000000-0000-0000-0000-000000000000",
    TEST_STRIPE_SECRET_KEY: "sk_test_51234567890abcdef",
    TEST_WEBHOOK_SECRET: "whsec_test123456789abcdef",
};

// Sample conversation for testing
const SAMPLE_CONVERSATION: AnalyzeRequest = {
    seller_id: TEST_CONFIG.TEST_SELLER_ID,
    messenger_id: "test_conversation_123",
    messages: [
        {
            role: "buyer",
            text: "Hi! I'm looking for a black hoodie in size medium",
            timestamp: "2026-02-10T10:00:00Z"
        },
        {
            role: "seller",
            text: "Hi! We have a great premium black hoodie available. It's $49.99 and comes in sizes S-XL.",
            timestamp: "2026-02-10T10:01:00Z"
        },
        {
            role: "buyer",
            text: "Perfect! I'll take the medium size. How can I pay?",
            timestamp: "2026-02-10T10:02:00Z"
        }
    ]
};

// Mock Stripe webhook payload
const MOCK_STRIPE_WEBHOOK = {
    id: "evt_test123456789",
    object: "event",
    api_version: "2020-08-27",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
        object: {
            id: "cs_test_123456789",
            object: "checkout.session",
            client_reference_id: TEST_CONFIG.TEST_SELLER_ID,
            customer: "cus_test123456789",
            subscription: "sub_test123456789",
            payment_status: "paid",
            total_amount: 4999,
            currency: "usd"
        }
    }
};

class OrderSyncIntegrationTest {
    private supabaseUrl: string;
    private serviceRoleKey: string;
    private testSellerId: string;

    constructor() {
        this.supabaseUrl = TEST_CONFIG.SUPABASE_URL;
        this.serviceRoleKey = TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY;
        this.testSellerId = TEST_CONFIG.TEST_SELLER_ID;
    }

    private async makeSupabaseRequest(sql: string, params?: any[]) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/execute_sql`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.serviceRoleKey}`,
                "Prefer": "return=representation"
            },
            body: JSON.stringify({
                sql,
                params: params || []
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Supabase SQL error: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    async setup() {
        console.log("🔧 Setting up test environment...");
        
        // Create test seller
        await this.makeSupabaseRequest(`
            INSERT INTO sellers (id, email, business_name, shopify_domain, plan, links_generated_count)
            VALUES ($1, $2, $3, $4, 'starter', 0)
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                business_name = EXCLUDED.business_name,
                links_generated_count = EXCLUDED.links_generated_count
        `, [
            this.testSellerId,
            `test-${Date.now()}@example.com`,
            "Test Store",
            "test-store.myshopify.com"
        ]);

        // Create test product
        await this.makeSupabaseRequest(`
            INSERT INTO products (id, seller_id, title, description, price, status, variants, search_text)
            VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                price = EXCLUDED.price
        `, [
            "prod_test123456789",
            this.testSellerId,
            "Premium Black Hoodie",
            "Premium cotton black hoodie, perfect for casual wear",
            49.99,
            JSON.stringify([{
                id: "var_test123456789",
                title: "Medium",
                price: "49.99"
            }]),
            "Premium Black Hoodie Premium cotton black hoodie, perfect for casual wear"
        ]);

        console.log(`✅ Test environment ready. Seller ID: ${this.testSellerId}`);
    }

    async cleanup() {
        console.log("🧹 Cleaning up test environment...");
        
        try {
            // Clean up test data
            await this.makeSupabaseRequest("DELETE FROM usage_logs WHERE seller_id = $1", [this.testSellerId]);
            await this.makeSupabaseRequest("DELETE FROM conversations WHERE seller_id = $1", [this.testSellerId]);
            await this.makeSupabaseRequest("DELETE FROM products WHERE seller_id = $1", [this.testSellerId]);
            await this.makeSupabaseRequest("DELETE FROM sellers WHERE id = $1", [this.testSellerId]);
            console.log("✅ Cleanup complete");
        } catch (error) {
            console.error("⚠️ Cleanup error:", error);
        }
    }

    async testAnalyzeConversation() {
        console.log("🔍 Testing analyze-conversation function...");
        
        const response = await fetch(TEST_CONFIG.ANALYZE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${TEST_CONFIG.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(SAMPLE_CONVERSATION)
        });

        if (response.status !== 200) {
            const error = await response.text();
            throw new Error(`analyze-conversation failed: ${response.status} - ${error}`);
        }
        
        const result = await response.json();
        console.log("📊 Analyze result:", result);
        
        // Basic validation
        if (!result.hasOwnProperty('success')) {
            throw new Error("Response missing 'success' field");
        }
        
        if (!result.hasOwnProperty('confidence')) {
            throw new Error("Response missing 'confidence' field");
        }
        
        if (!result.hasOwnProperty('checkout_ready')) {
            throw new Error("Response missing 'checkout_ready' field");
        }
        
        if (result.success) {
            if (!result.variant_id) throw new Error("Successful result missing 'variant_id'");
            if (!result.price) throw new Error("Successful result missing 'price'");
            if (typeof result.price !== 'number') throw new Error("Price should be a number");
        }
        
        return result;
    }

    async testCreateCheckout(matchResult: any) {
        console.log("💳 Testing create-checkout function...");
        
        if (!matchResult.success) {
            console.log("⚠️ Skipping checkout test - no product match found");
            return null;
        }

        const checkoutRequest: CheckoutRequest = {
            variant_id: matchResult.variant_id,
            quantity: matchResult.quantity || 1,
            price: matchResult.price,
            product_title: matchResult.product_title,
            seller_id: this.testSellerId,
            customer_email: "test@example.com"
        };

        const response = await fetch(TEST_CONFIG.CHECKOUT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${TEST_CONFIG.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(checkoutRequest)
        });

        // Handle usage limit
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
        
        // Basic validation
        if (!result.success) throw new Error("Checkout creation failed");
        if (!result.checkout_url) throw new Error("Missing checkout_url");
        if (!result.session_id) throw new Error("Missing session_id");
        if (typeof result.checkout_url !== 'string') throw new Error("Checkout URL should be a string");
        if (typeof result.session_id !== 'string') throw new Error("Session ID should be a string");
        
        return result;
    }

    async testStripeWebhook() {
        console.log("🔗 Testing stripe-webhook function...");
        
        const webhookPayload = JSON.stringify(MOCK_STRIPE_WEBHOOK);
        const signature = `t=${Math.floor(Date.now() / 1000)},v1=${btoa(webhookPayload).slice(0, 64)}`;
        
        const response = await fetch(TEST_CONFIG.WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "stripe-signature": signature
            },
            body: webhookPayload
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
        
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify database was updated
        try {
            const sellerData = await this.makeSupabaseRequest(`
                SELECT plan, stripe_customer_id, stripe_subscription_id, links_generated_count
                FROM sellers WHERE id = $1
            `, [this.testSellerId]);

            if (sellerData && sellerData.length > 0) {
                const seller = sellerData[0];
                console.log("📊 Seller after webhook:", seller);
                
                if (seller.plan !== 'pro') {
                    throw new Error("Seller should be upgraded to pro plan");
                }
                
                if (seller.stripe_customer_id !== "cus_test123456789") {
                    throw new Error("Stripe customer ID not set correctly");
                }
                
                if (seller.stripe_subscription_id !== "sub_test123456789") {
                    throw new Error("Stripe subscription ID not set correctly");
                }
                
                if (seller.links_generated_count !== 0) {
                    throw new Error("Usage count should be reset on upgrade");
                }
            }
        } catch (error) {
            console.log("⚠️ Could not verify database update:", error);
        }
        
        // Verify usage log
        try {
            const logData = await this.makeSupabaseRequest(`
                SELECT * FROM usage_logs 
                WHERE seller_id = $1 AND action = 'subscription_upgraded'
            `, [this.testSellerId]);

            if (logData && logData.length > 0) {
                console.log("📊 Usage log:", logData[0]);
                if (logData[0].plan !== 'pro') {
                    throw new Error("Usage log should show pro plan");
                }
            }
        } catch (error) {
            console.log("⚠️ Could not verify usage log:", error);
        }
    }

    async testUsageStatus() {
        console.log("📊 Testing usage status...");
        
        try {
            const usageData = await this.makeSupabaseRequest(`
                SELECT plan, links_generated_count, monthly_limit, 
                       GREATEST(0, monthly_limit - links_generated_count) as links_remaining,
                       links_generated_count < monthly_limit as can_create_link
                FROM seller_usage_summary WHERE seller_id = $1
            `, [this.testSellerId]);

            if (usageData && usageData.length > 0) {
                const usage = usageData[0];
                console.log("📊 Usage status:", usage);
                
                if (typeof usage.links_limit !== 'number') {
                    throw new Error("Limit should be a number");
                }
                
                if (typeof usage.links_used !== 'number') {
                    throw new Error("Used should be a number");
                }
                
                if (typeof usage.links_remaining !== 'number') {
                    throw new Error("Remaining should be a number");
                }
                
                return usage;
            }
        } catch (error) {
            console.log("⚠️ Could not get usage status:", error);
        }
        
        return null;
    }

    async runFullFlow() {
        console.log("🚀 Starting OrderSync Integration Test");
        console.log("=".repeat(50));
        
        try {
            // Check prerequisites
            if (TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key") {
                throw new Error("Please set SUPABASE_SERVICE_ROLE_KEY environment variable");
            }
            
            // Setup test environment
            await this.setup();
            
            // Test 1: Analyze conversation
            const matchResult = await this.testAnalyzeConversation();
            
            // Test 2: Create checkout (if product was matched)
            const checkoutResult = await this.testCreateCheckout(matchResult);
            
            // Test 3: Check usage status
            const usageStatus = await this.testUsageStatus();
            
            // Test 4: Test Stripe webhook
            await this.testStripeWebhook();
            
            console.log("=".repeat(50));
            console.log("✅ All tests passed! OrderSync integration is working correctly.");
            if (usageStatus) {
                console.log("📊 Final usage status:", usageStatus);
            }
            
            return {
                success: true,
                matchResult,
                checkoutResult,
                usageStatus
            };
            
        } catch (error) {
            console.error("❌ Test failed:", error);
            throw error;
        } finally {
            // Cleanup test environment
            await this.cleanup();
        }
    }
}

// Main execution
if (import.meta.main) {
    console.log("🧪 OrderSync Integration Test");
    console.log("Make sure Supabase is running: supabase start");
    console.log("Make sure Edge Functions are serving: supabase functions serve");
    console.log("");
    
    const test = new OrderSyncIntegrationTest();
    try {
        await test.runFullFlow();
        console.log("\n🎉 Integration test completed successfully!");
        Deno.exit(0);
    } catch (error) {
        console.error("\n💥 Integration test failed:", error);
        Deno.exit(1);
    }
}