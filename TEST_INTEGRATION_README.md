# OrderSync Integration Tests

This directory contains comprehensive integration tests for the OrderSync Revenue Wedge flow.

## Overview

The `test-integration.ts` script tests the complete OrderSync workflow:

1. **analyze-conversation** - AI-powered product matching from Messenger messages
2. **create-checkout** - Stripe checkout session creation with usage limits
3. **stripe-webhook** - Subscription lifecycle management
4. **Usage tracking** - Tiered pricing and limit enforcement

## Prerequisites

### 1. Local Supabase Setup

```bash
# Start Supabase locally
supabase start

# Serve Edge Functions locally
supabase functions serve --env-file supabase/.env
```

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key

# LLM Configuration (for analyze-conversation)
LLM_API_KEY=your_openai_or_moonshot_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_...
```

### 3. Database Setup

Ensure the migrations have been applied:

```bash
supabase db push
```

This will create:
- Sellers table with plan limits
- Products table with vector search
- Usage tracking tables
- RPC functions for usage management

## Running Tests

### Option 1: Deno Test (Recommended)

```bash
# Run all tests
deno test --allow-net --allow-env --allow-read test-integration.ts

# Run specific test
deno test --allow-net --allow-env --allow-read test-integration.ts --filter "OrderSync Full Integration Test"

# Run with verbose output
deno test --allow-net --allow-env --allow-read --verbose test-integration.ts
```

### Option 2: Standalone Execution

```bash
# Run as standalone script
deno run --allow-net --allow-env --allow-read test-integration.ts
```

## Test Structure

### Test Cases

1. **OrderSync Full Integration Test** - Complete end-to-end flow
2. **OrderSync - Analyze Conversation Only** - Tests AI product matching
3. **OrderSync - Usage Limits Check** - Tests tiered pricing enforcement

### Test Data

The test uses:

- **Mock Conversation**: 3 messages between buyer and seller about a black hoodie
- **Test Product**: "Premium Black Hoodie" with variant ID "var_test123456789"
- **Mock Webhook**: Stripe checkout.session.completed event
- **Test Seller**: UUID `00000000-0000-0000-0000-000000000000`

### What Gets Tested

#### 1. analyze-conversation Function
- ✅ Request/response format
- ✅ LLM intent detection
- ✅ Product matching (fuzzy + vector search)
- ✅ Response structure validation
- ✅ Conversation storage

#### 2. create-checkout Function
- ✅ Usage limit checking
- ✅ Stripe session creation
- ✅ Usage counter increment
- ✅ Error handling for limits
- ✅ Response with usage tracking

#### 3. stripe-webhook Function
- ✅ Webhook signature verification
- ✅ checkout.session.completed handling
- ✅ Plan upgrade (starter → pro)
- ✅ Usage counter reset
- ✅ Usage log creation

#### 4. Database Operations
- ✅ Seller creation and plan management
- ✅ Product creation with variants
- ✅ Usage status tracking
- ✅ Audit logging

## Expected Output

Successful test run:

```
🧪 Running OrderSync Integration Tests
Make sure Supabase is running locally: supabase start
Make sure Edge Functions are serving: supabase functions serve

🚀 Starting OrderSync Integration Test
==================================================
🔧 Setting up test environment...
✅ Test environment ready. Seller ID: 00000000-0000-0000-0000-000000000000
🔍 Testing analyze-conversation function...
📊 Analyze result: { success: true, variant_id: "var_test123456789", ... }
💳 Testing create-checkout function...
💳 Checkout result: { success: true, checkout_url: "https://checkout.stripe.com/...", ... }
📊 Testing usage limits...
📊 Current usage status: [{ plan: "starter", links_used: 1, links_limit: 20, ... }]
🔗 Testing stripe-webhook function...
🔗 Webhook result: { received: true }
📊 Seller after webhook: { plan: "pro", stripe_customer_id: "cus_test123456789", ... }
📊 Usage log: { action: "subscription_upgraded", plan: "pro", ... }
==================================================
✅ All tests passed! OrderSync integration is working correctly.
📊 Final usage status: { plan: "pro", links_used: 0, links_limit: 200, ... }
🧹 Cleaning up test environment...
✅ Cleanup complete
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: ConnectFailed: Connection refused (os error 61)
   ```
   - Make sure Supabase is running: `supabase start`
   - Make sure Edge Functions are serving: `supabase functions serve`

2. **Missing Environment Variables**
   ```
   Error: Please set SUPABASE_SERVICE_ROLE_KEY environment variable
   ```
   - Set up your `.env` file with local Supabase keys
   - Run: `supabase status` to get local keys

3. **Database Errors**
   ```
   Error: relation "sellers" does not exist
   ```
   - Run migrations: `supabase db push`
   - Check if migrations were applied successfully

4. **LLM API Errors**
   ```
   Error: LLM_API_KEY is required
   ```
   - Set your OpenAI or Moonshot API key
   - Check LLM_BASE_URL is correct

5. **Usage Limit Errors**
   ```
   🎯 Goal Reached! You've generated 20 links this month
   ```
   - Tests reset usage count automatically
   - If stuck, manually reset: `UPDATE sellers SET links_generated_count = 0 WHERE id = 'test-uuid';`

### Debug Mode

For detailed debugging, modify the test to add more logging:

```typescript
// Add to test methods for verbose output
console.log("Full response:", await response.text());
console.log("Headers:", Object.fromEntries(response.headers.entries()));
```

## Continuous Integration

To add to your CI/CD pipeline:

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      
      - name: Start Supabase
        run: |
          wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz
          tar xf supabase_linux_amd64.tar.gz
          ./supabase start
        
      - name: Run Integration Tests
        run: deno test --allow-net --allow-env --allow-read test-integration.ts
        env:
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

## Test Coverage

Current test coverage:
- ✅ All Edge Functions
- ✅ Database operations
- ✅ Usage limit enforcement
- ✅ Webhook handling
- ✅ Error scenarios
- ✅ Data validation

### Missing Tests (Future Enhancements)

- Performance tests under load
- Concurrent request handling
- Stripe webhook retry scenarios
- Vector search accuracy tests
- LLM prompt variations
- Invalid request handling
- Authentication edge cases