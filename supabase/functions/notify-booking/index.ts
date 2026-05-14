// supabase/functions/notify-booking/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function formatSGT(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

const jsonHeaders = { 'Content-Type': 'application/json' }

serve(async (req) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders })

  // Internal-only: require service role key from calling edge function
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!SUPABASE_SERVICE_ROLE_KEY || authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders })
  }

  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500, headers: jsonHeaders })

  let body: {
    status: string
    clientName?: string
    clientEmail?: string
    trainerName?: string
    scheduledAt?: string
    durationMins?: number
    amountSgd?: number
  }
  try { body = await req.json() }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders }) }

  const { status, clientEmail, clientName, trainerName, scheduledAt, durationMins, amountSgd } = body
  if (!status || !clientEmail) {
    return new Response(JSON.stringify({ error: 'status and clientEmail required' }), { status: 400, headers: jsonHeaders })
  }

  const safeName = escapeHtml(clientName ?? 'there')
  const safeTrainer = escapeHtml(trainerName ?? 'your trainer')
  const safeTime = scheduledAt ? escapeHtml(formatSGT(scheduledAt)) : ''
  const safeDuration = durationMins ? `${durationMins} minutes` : ''
  const safeAmount = amountSgd ? `S$${(amountSgd / 100).toFixed(0)}` : ''

  let subject: string
  let html: string

  if (status === 'booking_confirmed') {
    subject = 'Booking confirmed — FitnessGuru'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${safeName}, you're booked!</h2>
        <p>Your session with <strong>${safeTrainer}</strong> is confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; color: #555;">When</td><td style="padding: 8px 0; font-weight: bold;">${safeTime}</td></tr>
          <tr><td style="padding: 8px 0; color: #555;">Duration</td><td style="padding: 8px 0;">${safeDuration}</td></tr>
          ${safeAmount ? `<tr><td style="padding: 8px 0; color: #555;">Paid</td><td style="padding: 8px 0;">${safeAmount}</td></tr>` : ''}
        </table>
        <p style="color: #666; font-size: 14px;">You can cancel up to 24 hours before your session for a full refund.</p>
        <a href="https://fitness-guru-seven.vercel.app/dashboard/client"
           style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View My Bookings
        </a>
      </div>`
  } else if (status === 'booking_cancelled') {
    subject = 'Booking cancelled — FitnessGuru'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${safeName}, your booking has been cancelled.</h2>
        <p>Your session with <strong>${safeTrainer}</strong> scheduled for <strong>${safeTime}</strong> has been cancelled.</p>
        ${safeAmount ? `<p>A full refund of <strong>${safeAmount}</strong> has been issued and will appear in 5–10 business days.</p>` : ''}
        <a href="https://fitness-guru-seven.vercel.app/trainers"
           style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Book Another Session
        </a>
      </div>`
  } else {
    return new Response(JSON.stringify({ error: `Unknown status: ${status}` }), { status: 400, headers: jsonHeaders })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: clientEmail, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    return new Response(JSON.stringify({ error: body }), { status: 500, headers: jsonHeaders })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders })
})
