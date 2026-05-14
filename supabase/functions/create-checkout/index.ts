// supabase/functions/create-checkout/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://fitness-guru-seven.vercel.app'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}
const jsonHeaders = { ...cors, 'Content-Type': 'application/json' }

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: jsonHeaders })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return err('Method not allowed', 405)

  // Verify caller's Supabase session
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '')
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user }, error: authErr } = await adminClient.auth.getUser(jwt)
  if (authErr || !user) return err('Unauthorized', 401)

  let body: {
    trainer_id: string
    scheduled_at: string
    duration_mins: number
    client_name: string
    client_email: string
  }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON')
  }

  const { trainer_id, scheduled_at, duration_mins, client_name, client_email } = body
  if (!trainer_id || !scheduled_at || !duration_mins || !client_email) {
    return err('Missing required fields')
  }

  // Get trainer's hourly rate and name
  const { data: tp, error: tpErr } = await adminClient
    .from('trainer_profiles')
    .select('hourly_rate, profiles!inner(full_name)')
    .eq('id', trainer_id)
    .single()
  if (tpErr || !tp) return err('Trainer not found', 404)

  const amountSgd = Math.round(tp.hourly_rate * (duration_mins / 60))   // SGD dollars
  const amountCents = amountSgd * 100                                    // SGD cents

  // Insert pending booking row
  const { data: booking, error: bookingErr } = await adminClient
    .from('bookings')
    .insert({
      trainer_id,
      client_id: user.id,
      client_name,
      client_email,
      scheduled_at,
      duration_mins,
      status: 'pending',
      amount_sgd: amountCents,
    })
    .select('id')
    .single()
  if (bookingErr || !booking) {
    return err('Failed to create booking: ' + bookingErr?.message, 500)
  }

  // Create Stripe Checkout Session
  const trainerName = (tp.profiles as { full_name: string }).full_name
  const params = new URLSearchParams({
    'payment_method_types[]': 'card',
    mode: 'payment',
    'line_items[0][price_data][currency]': 'sgd',
    'line_items[0][price_data][unit_amount]': String(amountCents),
    'line_items[0][price_data][product_data][name]': `${duration_mins}-min session with ${trainerName}`,
    'line_items[0][quantity]': '1',
    success_url: `${APP_URL}/booking/confirmed?booking_id=${booking.id}`,
    cancel_url: `${APP_URL}/trainer/${trainer_id}?error=payment_cancelled`,
    'metadata[booking_id]': booking.id,
  })

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const session = await stripeRes.json()
  if (!stripeRes.ok) {
    // Clean up pending booking on Stripe error
    await adminClient.from('bookings').delete().eq('id', booking.id)
    return err(session.error?.message ?? 'Stripe error', 500)
  }

  // Save stripe_session_id to booking
  await adminClient
    .from('bookings')
    .update({ stripe_session_id: session.id })
    .eq('id', booking.id)

  return new Response(JSON.stringify({ session_url: session.url }), {
    status: 200,
    headers: jsonHeaders,
  })
})
