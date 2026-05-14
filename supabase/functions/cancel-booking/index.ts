import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

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

  let body: { booking_id: string }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON')
  }

  const { booking_id } = body
  if (!booking_id) return err('booking_id required')

  // Fetch the booking and verify ownership
  const { data: booking, error: fetchErr } = await adminClient
    .from('bookings')
    .select('*, trainer_profiles!inner(profiles!inner(full_name))')
    .eq('id', booking_id)
    .single()

  if (fetchErr || !booking) return err('Booking not found', 404)
  if (booking.client_id !== user.id) return err('Forbidden', 403)
  if (booking.status !== 'confirmed') return err('Only confirmed bookings can be cancelled')

  // Enforce 24-hour window
  const sessionTime = new Date(booking.scheduled_at).getTime()
  const hoursUntil = (sessionTime - Date.now()) / (1000 * 60 * 60)
  if (hoursUntil < 24) {
    return err('Cancellation window has passed — sessions can only be cancelled 24+ hours in advance')
  }

  // Issue Stripe refund
  if (booking.stripe_payment_intent_id) {
    const refundRes = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_intent: booking.stripe_payment_intent_id,
        reason: 'requested_by_customer',
      }).toString(),
    })
    const refund = await refundRes.json()
    if (!refundRes.ok) {
      return err('Stripe refund failed: ' + (refund.error?.message ?? 'unknown error'), 500)
    }
  }

  // Update booking status to cancelled
  await adminClient.from('bookings').update({ status: 'cancelled' }).eq('id', booking_id)

  // Send cancellation emails (fire-and-forget)
  const trainerName = (booking.trainer_profiles as { profiles: { full_name: string } })?.profiles?.full_name ?? 'Trainer'
  const emailPayload = {
    status: 'booking_cancelled',
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    trainerName,
    scheduledAt: booking.scheduled_at,
    durationMins: booking.duration_mins,
    amountSgd: booking.amount_sgd,
  }
  adminClient.functions.invoke('notify-booking', { body: emailPayload }).catch(() => {})

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders })
})
