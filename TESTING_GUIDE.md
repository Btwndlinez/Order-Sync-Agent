# OrderSync Testing Guide

## 🎯 The Three-Phase Testing Strategy

This guide walks you through testing the complete OrderSync Revenue Wedge flow using a three-phase approach designed to catch issues early and verify functionality systematically.

---

## 🔌 Phase 1: Connectivity Check

**Purpose**: Verify your environment is properly configured and all services are responding.

**Command**: 
```bash
deno run --allow-net --allow-env test-integration-simple.ts
```

### What This Tests:
- ✅ Supabase database connection
- ✅ Edge Functions are serving locally
- ✅ Environment variables are set correctly
- ✅ Database migrations applied
- ✅ Basic HTTP connectivity to all endpoints

### Expected Output:
```
🔌 CONNECTIVITY CHECK - OrderSync Integration Test
============================================================
Phase 1: Testing environment and basic connectivity
...
🎉 CONNECTIVITY CHECK PASSED!
✅ Your environment is ready for advanced testing
```

### If It Fails:
The test provides detailed troubleshooting steps for:
- Supabase status checks
- Edge Function serving verification
- Environment variable validation
- Database migration confirmation

---

## 🔥 Phase 2: Logic Burn

**Purpose**: Use formal assertions to test the actual business logic and Vector Search accuracy.

**Command**:
```bash
deno test --allow-net --allow-env test-integration.ts
```

### What This Tests:
- ✅ **AI Intent Detection**: LLM correctly identifies purchase intent
- ✅ **Vector Search Accuracy**: Returns the correct "Premium Black Hoodie" not just any hoodie
- ✅ **Product Matching**: Database finds exact variant_id "var_test123456789"
- ✅ **Formal Assertions**: Type-safe validation of all responses
- ✅ **Usage Limits**: Enforces the 20-link starter limit
- ✅ **Error Scenarios**: Proper handling of edge cases

### Key Assertions:
```typescript
// Verify the RIGHT product is matched
assertEquals(result.variant_id, "var_test123456789");
assertEquals(result.product_title, "Premium Black Hoodie");

// Verify pricing is correct
assertEquals(typeof result.price, "number");
assert(result.price > 0);

// Verify usage tracking
assertExists(result.usage.remaining, "Should track remaining usage");
```

### Expected Output:
```
running 3 tests
test OrderSync Full Integration Test ... ok (152ms)
test OrderSync - Analyze Conversation Only ... ok (45ms)
test OrderSync - Usage Limits Check ... ok (23ms)

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured
```

### If It Fails:
- **Wrong Product Matched**: Check product data and embeddings
- **Vector Search Issues**: Verify pgvector extension and embeddings
- **Usage Logic Errors**: Check tiered pricing SQL functions
- **LLM Not Responding**: Verify API keys and endpoints

---

## 🏆 Phase 3: "Success Milestone" Simulation

**Purpose**: Experience the satisfying moment when usage_count flips from 20→0 and a user upgrades from starter→pro.

**Command**:
```bash
deno run --allow-net --allow-env test-success-milestone.ts
```

### What This Simulates:
1. **User at Limit**: Seller has used 19/20 links
2. **Limit Hit**: Tries to create 20th link, gets upgrade prompt
3. **Payment Simulation**: Mock Stripe webhook for $49 Pro plan
4. **The Magic Moment**: Watch usage reset and plan upgrade

### Expected Output:
```
🎯 ORDERsync SUCCESS MILESTONE TEST
============================================================
Watch as the usage_count flips from 20→0 and plan changes starter→pro!

📊 BEFORE UPGRADE - Almost at limit!
----------------------------------------
Plan: STARTER
Used: 19 links
Limit: 20 links
Remaining: 1 links
Usage: 95.0%
Progress: [████████████████████░] 95%

⚠️ User tries to create one more checkout link...
🚫 ERROR: Goal Reached! You've generated 20 links this month.
💡 PROMPT: Ready to scale to 200 links for just $30 more?

📊 AT LIMIT - Upgrade prompted!
----------------------------------------
Plan: STARTER
Used: 20 links
Limit: 20 links
Remaining: 0 links
Usage: 100.0%
Progress: [████████████████████] 100%

🚀 TRIGGERING UPGRADE WEBHOOK
==================================================
Simulating: User pays $49 to upgrade to Pro plan
Expected: Usage count flips from 20 → 0
Expected: Plan changes: starter → pro

📊 AFTER UPGRADE - Fresh start!
----------------------------------------
Plan: PRO
Used: 0 links
Limit: 200 links
Remaining: 200 links
Usage: 0.0%
Progress: [░░░░░░░░░░░░░░░░░░░░] 0%

🏆 SUCCESS MILESTONE ACHIEVED!
==================================================
🔄 USAGE TRANSFORMATION:
   Before: starter plan, 20/20 links
   After:  pro plan, 0/200 links
   ✅ Plan upgraded: starter → pro
   ✅ Usage reset: 20 → 0
   ✅ Limit increased: 20 → 200

💰 Revenue Impact:
   Starter plan: $19/month
   Pro plan: $49/month
   📈 Monthly revenue increase: +$30

🎊 Celebrate this moment!
   Your OrderSync system just converted a free user to a paid customer!
   The usage limits worked perfectly - hitting 20 links triggered the upgrade!
```

---

## 🚀 Quick Start Sequence

### 1. Environment Setup
```bash
# Start Supabase
supabase start

# Serve Edge Functions
supabase functions serve --env-file supabase/.env

# Set environment variables
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="your_local_anon_key"
export SUPABASE_SERVICE_ROLE_KEY="your_local_service_role_key"
```

### 2. Run Tests in Order
```bash
# Phase 1: Connectivity Check
deno run --allow-net --allow-env test-integration-simple.ts

# Phase 2: Logic Burn (only if Phase 1 passes)
deno test --allow-net --allow-env test-integration.ts

# Phase 3: Success Milestone (reward yourself!)
deno run --allow-net --allow-env test-success-milestone.ts
```

---

## 🔍 What Each Test Validates

### Phase 1 - Connectivity
- [ ] Supabase API accessible
- [ ] Database schema exists
- [ ] Edge Functions deployed
- [ ] Network connectivity working
- [ ] Basic CRUD operations

### Phase 2 - Business Logic
- [ ] LLM extracts purchase intent correctly
- [ ] Vector Search finds the right product
- [ ] Pricing calculations accurate
- [ ] Usage limits enforced
- [ ] Stripe session creation works
- [ ] Error handling robust

### Phase 3 - User Journey
- [ ] Usage limits trigger upgrade flow
- [ ] Stripe webhook processes correctly
- [ ] Database updates atomically
- [ ] Usage counters reset properly
- [ ] Revenue tracking works
- [ ] Customer experience smooth

---

## 🛠️ Common Issues & Solutions

### "Connection Refused" Errors
```bash
# Check Supabase status
supabase status

# Should show:
# API URL: http://localhost:54321
# DB URL: postgresql://localhost:54322
```

### "Missing Environment Variables"
```bash
# Get local keys from Supabase
supabase status

# Set them in your shell
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### "Edge Functions Not Responding"
```bash
# Check if functions are serving
curl http://localhost:54321/functions/v1/analyze-and-match

# Should return: {"error":"Missing required field"} (good error = function is running)
```

### "Database Schema Missing"
```bash
# Apply migrations
supabase db push

# Verify tables exist
supabase db shell
\dt
# Should show: sellers, products, conversations, usage_logs, etc.
```

### "Vector Search Not Working"
```bash
# Check pgvector extension
supabase db shell
SELECT * FROM pg_extension WHERE extname = 'vector';

# Should return one row with the vector extension
```

---

## 🎊 Success Metrics

When all tests pass, you have:

✅ **Production-Ready OrderSync System**
- AI-powered product matching working
- Stripe payments integrated
- Tiered pricing enforced
- Usage limits working
- Webhook processing reliable
- Database operations atomic
- Revenue tracking accurate

✅ **Complete Test Coverage**
- Environment connectivity validated
- Business logic verified
- User journey tested
- Edge cases handled
- Error scenarios covered

✅ **Satisfied Milestone Moment**
- Watch usage_count: 20 → 0
- Watch plan: starter → pro  
- Watch revenue: $19 → $49/month
- Watch customer: frustrated → delighted

🚀 **Ready for Production Deployment!**

---

## 📝 Next Steps After Testing

1. **Deploy to Production**: `supabase functions deploy`
2. **Set Production Secrets**: `supabase secrets set`
3. **Configure Stripe Webhooks**: Production endpoint
4. **Monitor Usage**: Set up analytics dashboards
5. **Scale**: Add more products and users

Congratulations! You now have a fully tested OrderSync Revenue Wedge ready to convert Messenger conversations into revenue! 🎉