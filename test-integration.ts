// OrderSync Integration Test Suite
// Full flow: analyze-conversation -> create-checkout -> stripe-webhook
// Run with: deno test --allow-net --allow-env test-integration.ts

import { 
    assertEquals, 
    assertExists, 
    assertMatch 
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Test Configuration
const CONFIG = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "http://localhost:54321",
    SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") || "your-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "your-service-role-key",
    
    // Edge Function URLs
    ANALYZE_URL: "http://localhost:54321/functions/v1/analyze-conversation",
    CHECKOUT_URL: "http://localhost:54321/functions/v1/create-checkout",
    WEBHOOK_URL: "http://localhost:54321/functions/v1/stripe-webhook",
    
    // Test data
    TEST_SELLER_ID: "test-seller-" + Date.now(),
};

// Dummy conversation for testing
const DUMMY_CONVERSATION = {
    seller_id: CONFIG.TEST_SELLER_ID,
    messenger_id: "test_conversation_456",
    messages: [
        {
            role: "buyer" as const,
            text: "Hey, do you have any blue t-shirts in stock?",
            timestamp: new Date().toISOString()
        },
        {
            role: "seller" as const,
            text: "Yes! We have Navy Blue Cotton Tees for $29.99. What size?",
            timestamp: new Date().toISOString()
        },
        {
            role: "buyer" as const,
            text: "Large please. Can I get 2 of them?",
            timestamp: new Date().toISOString()
        }
    ]
};

// Mock Stripe webhook payload for checkout completion
const MOCK_STRIPE_WEBHOOK_PAYLOAD = {
    id: "evt_test_integration_123",
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
        object: {
            id: "cs_test_integration_456",
            object: "checkout.session",
            client_reference_id: CONFIG.TEST_SELLER_ID,
            customer: "cus_test_integration_789",
            subscription: "sub_test_integration_abc",
            payment_status: "paid",
            amount_total: 5998,
            currency: "usd",
            customer_details: {
                email: "test-integration@example.com"
            }
        }
    }
};

// Helper class for test operations
class IntegrationTestHelper {
    supabase: any;
    private testSellerId: string;

    constructor() {
        this.testSellerId = CONFIG.TEST_SELLER_ID;
        this.supabase = createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    async setup() {
        // Create test seller
        const { error: sellerError } = await this.supabase
            .from('sellers')
            .upsert({
                id: this.testSellerId,
                email: `test-${Date.now()}@integration.com`,
                business_name: "Integration Test Store",
                shopify_domain: "integration-test.myshopify.com",
                plan: 'starter',
                links_generated_count: 0,
                usage_period_start: new Date().toISOString().split('T')[0]
            });

        if (sellerError) {
            throw new Error(`Failed to create test seller: ${sellerError.message}`);
        }

        // Create test product
        const { error: productError } = await this.supabase
            .from('products')
            .upsert({
                id: `prod_test_${this.testSellerId}`,
                seller_id: this.testSellerId,
                title: "Navy Blue Cotton Tee",
                description: "Premium navy blue cotton t-shirt",
                price: 29.99,
                status: 'active',
                search_text: "Navy Blue Cotton Tee Premium navy blue cotton t-shirt",
                variants: JSON.stringify([
                    {
                        id: `var_test_${this.testSellerId}`,
                        title: "Large",
                        price: "29.99",
                        sku: "BLUE-TEE-L"
                    }
                ])
            });

        if (productError) {
            throw new Error(`Failed to create test product: ${productError.message}`);
        }
    }

    async cleanup() {
        // Clean up test data
        await this.supabase.from('usage_logs').delete().eq('seller_id', this.testSellerId);
        await this.supabase.from('conversations').delete().eq('seller_id', this.testSellerId);
        await this.supabase.from('products').delete().eq('seller_id', this.testSellerId);
        await this.supabase.from('sellers').delete().eq('id', this.testSellerId);
    }

    async getSeller() {
        const { data, error } = await this.supabase
            .from('sellers')
            .select('*')
            .eq('id', this.testSellerId)
            .single();
        
        if (error) throw error;
        return data;
    }

    async getUsageCount(): Promise<number> {
        const seller = await this.getSeller();
        return seller?.links_generated_count || 0;
    }

    async resetUsage() {
        await this.supabase
            .from('sellers')
            .update({ links_generated_count: 0 })
            .eq('id', this.testSellerId);
    }
}

// Test Suite
Deno.test("OrderSync Full Integration Flow", async (t) => {
    const helper = new IntegrationTestHelper();
    
    // Setup
    await t.step("setup test environment", async () => {
        await helper.setup();
        const seller = await helper.getSeller();
        assertExists(seller);
        assertEquals(seller.id, CONFIG.TEST_SELLER_ID);
        assertEquals(seller.plan, 'starter');
    });

    // Test 1: Analyze Conversation
    let analysisResult: any;
    await t.step("analyze-conversation detects intent and matches product", async () => {
        const response = await fetch(CONFIG.ANALYZE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(DUMMY_CONVERSATION)
        });

        assertEquals(response.status, 200, "analyze-conversation should return 200");
        
        analysisResult = await response.json();
        console.log("📊 Analysis result:", analysisResult);
        
        // Verify response structure
        assertExists(analysisResult.intent_detected, "Should have intent_detected field");
        assertExists(analysisResult.confidence, "Should have confidence field");
        
        if (analysisResult.intent_detected) {
            assertExists(analysisResult.product_title, "Should detect product title");
            assertExists(analysisResult.quantity, "Should detect quantity");
            assertEquals(typeof analysisResult.confidence, "number", "Confidence should be a number");
            assertEquals(analysisResult.confidence >= 0 && analysisResult.confidence <= 1, true, 
                "Confidence should be between 0 and 1");
        }
    });

    // Test 2: Create Checkout (simulates Stripe session creation)
    let checkoutResult: any;
    let initialUsageCount: number;
    await t.step("create-checkout creates Stripe session and increments usage", async () => {
        // Get initial usage count
        initialUsageCount = await helper.getUsageCount();
        console.log(`📊 Initial usage count: ${initialUsageCount}`);

        // Use analysis result or create fallback
        const checkoutRequest = {
            variant_id: analysisResult?.variant_id || `var_test_${CONFIG.TEST_SELLER_ID}`,
            quantity: analysisResult?.quantity || 2,
            price: 29.99,
            product_title: analysisResult?.product_title || "Navy Blue Cotton Tee",
            seller_id: CONFIG.TEST_SELLER_ID,
            customer_email: "test@example.com"
        };

        const response = await fetch(CONFIG.CHECKOUT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(checkoutRequest)
        });

        // If usage limit reached, that's a valid test result too
        if (response.status === 403) {
            const errorResult = await response.json();
            console.log("⚠️ Usage limit reached:", errorResult);
            assertExists(errorResult.error);
            assertEquals(errorResult.error, "limit_reached");
            return;
        }

        assertEquals(response.status, 200, "create-checkout should return 200");
        
        checkoutResult = await response.json();
        console.log("💳 Checkout result:", checkoutResult);
        
        // Verify Stripe session was created
        assertExists(checkoutResult.success, "Should have success field");
        assertEquals(checkoutResult.success, true, "Checkout should be successful");
        assertExists(checkoutResult.session_id, "Should have Stripe session_id");
        assertExists(checkoutResult.checkout_url, "Should have checkout_url");
        
        // Verify the checkout URL looks like a Stripe URL
        assertMatch(checkoutResult.checkout_url, /^https:\/\/(checkout\.stripe\.com|pay\.stripe\.link)/,
            "Checkout URL should be a valid Stripe URL");
        
        // Verify usage tracking
        assertExists(checkoutResult.usage, "Should have usage information");
        assertExists(checkoutResult.usage.plan, "Usage should have plan");
        assertExists(checkoutResult.usage.used, "Usage should have used count");
        assertExists(checkoutResult.usage.limit, "Usage should have limit");
        
        // Verify usage was incremented
        const newUsageCount = checkoutResult.usage.used;
        console.log(`📊 New usage count: ${newUsageCount}`);
        assertEquals(newUsageCount, initialUsageCount + 1, 
            "Usage count should be incremented by 1");
    });

    // Test 3: Webhook Handling
    await t.step("stripe-webhook processes checkout completion", async () => {
        const webhookPayload = JSON.stringify(MOCK_STRIPE_WEBHOOK_PAYLOAD);
        const signature = `t=${Math.floor(Date.now() / 1000)},v1=${btoa(webhookPayload).slice(0, 64)}`;
        
        const response = await fetch(CONFIG.WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "stripe-signature": signature
            },
            body: webhookPayload
        });

        assertEquals(response.status, 200, "stripe-webhook should return 200");
        
        const result = await response.json();
        console.log("🔗 Webhook result:", result);
        
        assertExists(result.received, "Webhook should confirm receipt");
        assertEquals(result.received, true, "Webhook should acknowledge receipt");
        
        // Wait for async DB operations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify seller was upgraded to pro
        const seller = await helper.getSeller();
        console.log("📊 Seller after webhook:", seller);
        
        assertEquals(seller.plan, 'pro', "Seller should be upgraded to pro plan");
        assertEquals(seller.stripe_customer_id, MOCK_STRIPE_WEBHOOK_PAYLOAD.data.object.customer,
            "Stripe customer ID should be set");
        assertEquals(seller.stripe_subscription_id, MOCK_STRIPE_WEBHOOK_PAYLOAD.data.object.subscription,
            "Stripe subscription ID should be set");
        assertEquals(seller.links_generated_count, 0, 
            "Usage count should be reset to 0 after upgrade");
    });

    // Test 4: Verify usage log was created
    await t.step("usage log is created for subscription upgrade", async () => {
        const { data: usageLogs, error } = await helper.supabase
            .from('usage_logs')
            .select('*')
            .eq('seller_id', CONFIG.TEST_SELLER_ID)
            .eq('action', 'subscription_upgraded');
        
        if (error) throw error;
        
        assertExists(usageLogs);
        assertEquals(usageLogs.length >= 1, true, "Should have at least one usage log entry");
        
        const upgradeLog = usageLogs[0];
        console.log("📊 Usage log:", upgradeLog);
        
        assertEquals(upgradeLog.plan, 'pro', "Log should show pro plan");
        assertEquals(upgradeLog.action, 'subscription_upgraded', "Action should be subscription_upgraded");
        assertExists(upgradeLog.metadata, "Should have metadata");
        assertExists(upgradeLog.metadata.stripe_customer_id, "Metadata should have stripe_customer_id");
    });

    // Cleanup
    await t.step("cleanup test environment", async () => {
        await helper.cleanup();
        console.log("✅ Test environment cleaned up");
    });
});

// Individual component tests
Deno.test("analyze-conversation standalone", async () => {
    const helper = new IntegrationTestHelper();
    
    try {
        await helper.setup();
        
        const response = await fetch(CONFIG.ANALYZE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(DUMMY_CONVERSATION)
        });

        assertEquals(response.status, 200);
        
        const result = await response.json();
        assertExists(result.intent_detected);
        assertExists(result.confidence);
        
    } finally {
        await helper.cleanup();
    }
});

Deno.test("stripe-webhook standalone", async () => {
    const helper = new IntegrationTestHelper();
    
    try {
        await helper.setup();
        
        const webhookPayload = JSON.stringify(MOCK_STRIPE_WEBHOOK_PAYLOAD);
        const signature = `t=${Math.floor(Date.now() / 1000)},v1=${btoa(webhookPayload).slice(0, 64)}`;
        
        const response = await fetch(CONFIG.WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "stripe-signature": signature
            },
            body: webhookPayload
        });

        assertEquals(response.status, 200);
        
        const result = await response.json();
        assertExists(result.received);
        assertEquals(result.received, true);
        
    } finally {
        await helper.cleanup();
    }
});

// Test usage limit enforcement
Deno.test("usage limits are enforced correctly", async () => {
    const helper = new IntegrationTestHelper();
    
    try {
        await helper.setup();
        
        // Set usage to near limit
        await helper.supabase
            .from('sellers')
            .update({ links_generated_count: 19 }) // Starter plan limit is 20
            .eq('id', CONFIG.TEST_SELLER_ID);
        
        // This should work (19 + 1 = 20)
        const response1 = await fetch(CONFIG.CHECKOUT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                variant_id: `var_test_${CONFIG.TEST_SELLER_ID}`,
                quantity: 1,
                price: 29.99,
                product_title: "Test Product",
                seller_id: CONFIG.TEST_SELLER_ID,
                customer_email: "test@example.com"
            })
        });

        // Should either succeed or be blocked by usage limit
        assertEquals([200, 403].includes(response1.status), true, 
            "Should return 200 or 403");
        
        if (response1.status === 200) {
            // Set usage at limit
            await helper.supabase
                .from('sellers')
                .update({ links_generated_count: 20 })
                .eq('id', CONFIG.TEST_SELLER_ID);
            
            // This should be blocked (at 20, next would be 21)
            const response2 = await fetch(CONFIG.CHECKOUT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    variant_id: `var_test_${CONFIG.TEST_SELLER_ID}`,
                    quantity: 1,
                    price: 29.99,
                    product_title: "Test Product",
                    seller_id: CONFIG.TEST_SELLER_ID,
                    customer_email: "test@example.com"
                })
            });

            assertEquals(response2.status, 403, "Should be blocked at usage limit");
            
            const errorResult = await response2.json();
            assertEquals(errorResult.error, "limit_reached");
        }
        
    } finally {
        await helper.cleanup();
    }
});

// Main execution for standalone running
if (import.meta.main) {
    console.log("🧪 OrderSync Integration Test Suite");
    console.log("=" .repeat(60));
    console.log("");
    console.log("Run individual tests with:");
    console.log("  deno test --allow-net --allow-env test-integration.ts");
    console.log("");
    console.log("Prerequisites:");
    console.log("  1. Supabase running: supabase start");
    console.log("  2. Edge Functions serving: supabase functions serve");
    console.log("  3. Environment variables set:");
    console.log("     - SUPABASE_URL");
    console.log("     - SUPABASE_ANON_KEY");
    console.log("     - SUPABASE_SERVICE_ROLE_KEY");
    console.log("     - STRIPE_SECRET_KEY (for create-checkout)");
    console.log("     - STRIPE_WEBHOOK_SIGNING_SECRET (for webhook)");
    console.log("");
}
