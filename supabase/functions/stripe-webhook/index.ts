// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Verify Stripe webhook signature using Web Crypto (HMAC-SHA256)
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(',')
  const tPart = parts.find(p => p.startsWith('t='))
  const v1Part = parts.find(p => p.startsWith('v1='))
  if (!tPart || !v1Part) return false

  const timestamp = tPart.slice(2)
  const signature = v1Part.slice(3)
  const signedPayload = `${timestamp}.${payload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const computed = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === signature
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const sigHeader = req.headers.get('stripe-signature') ?? ''
  const rawBody = await req.text()

  const valid = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)
  if (!valid) {
    return new Response('Invalid signature', { status: 400 })
  }

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = (session.metadata as Record<string, string>)?.booking_id
    const paymentIntent = session.payment_intent as string | null

    if (bookingId) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

      await adminClient.from('bookings').update({
        status: 'confirmed',
        stripe_payment_intent_id: paymentIntent,
      }).eq('id', bookingId)

      // Fire-and-forget: send booking confirmation email to client
      const { data: booking } = await adminClient
        .from('bookings')
        .select('client_name, client_email, scheduled_at, duration_mins, amount_sgd, trainer_profiles!inner(profiles!inner(full_name))')
        .eq('id', bookingId)
        .single()

      if (booking) {
        const trainerName = (booking.trainer_profiles as { profiles: { full_name: string } })?.profiles?.full_name ?? 'your trainer'
        adminClient.functions.invoke('notify-booking', {
          body: {
            status: 'booking_confirmed',
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            trainerName,
            scheduledAt: booking.scheduled_at,
            durationMins: booking.duration_mins,
            amountSgd: booking.amount_sgd,
          },
        }).catch(() => {})
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
