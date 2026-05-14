# Deployment Notes

## Stripe Setup (Manual — Required Before Testing Payments)

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com) in test mode
2. Go to Developers → API keys → copy Secret key (`sk_test_...`)
3. Go to Developers → Webhooks → Add endpoint:
   - URL: `https://wnwmlaqhyztwxyvzuqpe.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`
   - Copy the Signing secret (`whsec_...`)
4. Set the secrets:

```bash
SUPABASE_ACCESS_TOKEN=REDACTED_SUPABASE_PAT ~/bin/supabase secrets set \
  --project-ref wnwmlaqhyztwxyvzuqpe \
  STRIPE_SECRET_KEY=sk_test_YOUR_KEY \
  STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

## End-to-End Test Checklist

- [ ] Visit `/trainers` — approved trainer cards load
- [ ] Click a trainer — profile + slots load
- [ ] Select a slot + click "Book & Pay" — redirects to Stripe Checkout
- [ ] Complete payment with test card `4242 4242 4242 4242`
- [ ] Redirects to `/booking/confirmed?booking_id=...`
- [ ] Visit `/dashboard/client` — booking shows as confirmed
- [ ] Click "Cancel & Refund" — booking cancelled, Stripe refund issued
- [ ] Check trainer's `/dashboard/trainer` Appointments tab — booking visible
- [ ] Trainer clicks "Mark done" — status becomes completed
