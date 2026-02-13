# Stripe Webhook Setup Guide

This document outlines how to set up Stripe webhooks for the OrderSync tiered pricing system.

## Overview

The `stripe-webhook` Edge Function handles subscription lifecycle events from Stripe, automatically upgrading/downgrading users based on their payment status.

## Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upgrade user to 'pro', reset usage count |
| `invoice.payment_failed` | Log payment failure, notify user |
| `customer.subscription.deleted` | Downgrade user to 'starter' |

## Setup Instructions

### 1. Local Development

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (via scoop)
scoop install stripe

# Linux
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

Login to Stripe:
```bash
stripe login
```

Forward webhooks to local Supabase:
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

This will output a webhook signing secret starting with `whsec_`:
```
> Ready! You are using Stripe API Version [2023-10-16].
> Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxx (^C to quit)
```

### 2. Set Environment Variables

Add the webhook secret to your local environment:

**File: `supabase/.env`**
```bash
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_xxxxxxxxxxxxxxxxxxx
```

For production:
```bash
supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_live_xxxxxxxxxxxxxxxxxxx
```

### 3. Production Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production URL:
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated` (optional)

5. Copy the "Signing secret" from the webhook details page
6. Set it in Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_live_xxxxxxxxxx
   ```

### 4. Testing Webhooks

Trigger test events via Stripe CLI:

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test payment failure
stripe trigger invoice.payment_failed

# Test subscription cancellation
stripe trigger customer.subscription.deleted
```

### 5. Integration with Checkout

When creating a checkout session, pass the user's ID as `client_reference_id`:

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  client_reference_id: user.id, // Supabase user UUID
  line_items: [{
    price: 'price_xxx', // Your Pro plan price ID
    quantity: 1,
  }],
  success_url: 'https://ordersync.app/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://ordersync.app/cancel',
});
```

## Webhook Payload Structure

### checkout.session.completed

```json
{
  "id": "evt_xxx",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_xxx",
      "client_reference_id": "user-uuid-from-supabase",
      "customer": "cus_xxx",
      "subscription": "sub_xxx",
      "amount_total": 1900,
      "currency": "usd"
    }
  }
}
```

### Database Updates

When a webhook is received, the function:

1. **Verifies** the Stripe signature
2. **Extracts** the `client_reference_id` (user's Supabase UUID)
3. **Updates** the `sellers` table:
   - Sets `plan` to 'pro'
   - Stores `stripe_customer_id`
   - Stores `stripe_subscription_id`
   - Resets `links_generated_count` to 0
   - Updates `usage_period_start` to today
4. **Logs** the event in `usage_logs` table

## Troubleshooting

### Webhook not receiving events

1. Check URL is correct and publicly accessible
2. Verify `STRIPE_WEBHOOK_SIGNING_SECRET` is set
3. Check Supabase function logs:
   ```bash
   supabase functions logs stripe-webhook
   ```

### Signature verification failing

1. Ensure you're using the correct webhook secret (test vs live)
2. Check that the raw payload body is being used (not parsed JSON)
3. Verify the `stripe-signature` header is being forwarded

### Database updates not happening

1. Check that `client_reference_id` is set in checkout session
2. Verify user exists in `sellers` table with matching ID
3. Check Supabase logs for errors

## Security Considerations

1. **Always verify signatures** - Never trust webhook data without verification
2. **Use service role key** - The function uses `SUPABASE_SERVICE_ROLE_KEY` for database access
3. **Idempotency** - Events may be delivered multiple times; ensure your handlers are idempotent
4. **Log everything** - Keep audit logs of all subscription changes

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
