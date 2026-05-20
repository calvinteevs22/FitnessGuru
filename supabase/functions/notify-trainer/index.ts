import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatSGT(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function buildIcs({
  uid, dtstart, durationMins, summary, description, location,
}: {
  uid: string; dtstart: string; durationMins: number
  summary: string; description: string; location: string
}): string {
  const start = new Date(dtstart)
  const end = new Date(start.getTime() + durationMins * 60_000)
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//ReadyPT//ReadyPT//EN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@readyptsg.com`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location || 'TBD'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

const corsErrorHeaders = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsErrorHeaders })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: corsErrorHeaders })
  }

  let body: {
    trainerName?: string; trainerEmail?: string; status?: string; adminNotes?: string
    clientName?: string; scheduledAt?: string; durationMins?: number
    venueName?: string; amountSgd?: number; bookingId?: string
  }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsErrorHeaders })
  }
  const { trainerName, trainerEmail, status, adminNotes, clientName, scheduledAt, durationMins, venueName, amountSgd, bookingId } = body

  if (!trainerEmail || !status) {
    return new Response(JSON.stringify({ error: 'trainerEmail and status are required' }), { status: 400, headers: corsErrorHeaders })
  }

  const safeName = escapeHtml(trainerName ?? 'Trainer')
  const safeNotes = adminNotes ? escapeHtml(adminNotes) : null

  let subject: string
  let html: string
  let attachments: { filename: string; content: string }[] = []

  if (status === 'booking_new') {
    const safeClient = escapeHtml(clientName ?? 'A client')
    const safeTime = scheduledAt ? escapeHtml(formatSGT(scheduledAt)) : 'TBD'
    const safeVenue = venueName ? escapeHtml(venueName) : ''
    const safeDuration = durationMins ? `${durationMins} min` : ''
    const safeEarnings = amountSgd ? `S$${((amountSgd / 100) * 0.8).toFixed(0)}` : ''

    subject = 'New booking — ReadyPT'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${safeName}, you have a new booking!</h2>
        <p><strong>${safeClient}</strong> has booked a session with you.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; color: #555;">When</td><td style="padding: 8px 0; font-weight: bold;">${safeTime}</td></tr>
          ${safeVenue ? `<tr><td style="padding: 8px 0; color: #555;">Where</td><td style="padding: 8px 0; font-weight: bold;">${safeVenue}</td></tr>` : ''}
          ${safeDuration ? `<tr><td style="padding: 8px 0; color: #555;">Duration</td><td style="padding: 8px 0;">${safeDuration}</td></tr>` : ''}
          ${safeEarnings ? `<tr><td style="padding: 8px 0; color: #555;">Your earnings</td><td style="padding: 8px 0; color: #2D6A27; font-weight: bold;">${safeEarnings}</td></tr>` : ''}
        </table>
        <p style="color: #666; font-size: 14px;">A calendar invite is attached. Your client can cancel up to 24 hours before the session.</p>
        <a href="https://readyptsg.com/dashboard/trainer"
           style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View Dashboard
        </a>
      </div>`

    if (scheduledAt && durationMins) {
      const uid = bookingId ?? String(Date.now())
      const ics = buildIcs({
        uid,
        dtstart: scheduledAt,
        durationMins,
        summary: `PT Session — ${clientName ?? 'Client'}`,
        description: `Session with ${clientName ?? 'client'}${venueName ? ` at ${venueName}` : ''}. Duration: ${durationMins} min.`,
        location: venueName ?? '',
      })
      attachments = [{ filename: 'session.ics', content: btoa(ics) }]
    }
  } else if (status === 'submitted') {
    subject = 'Application received — ReadyPT'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${safeName}, we've got your application!</h2>
        <p>Thanks for applying to join ReadyPT as a trainer. Your profile is now under review and we'll get back to you within 48 hours.</p>
        <p>In the meantime, you can log in to your dashboard to check your status.</p>
        <a href="https://readyptsg.com/dashboard/trainer" style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View your dashboard
        </a>
      </div>
    `
  } else if (status === 'approved') {
    subject = '🎉 Your ReadyPT application has been approved!'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Welcome to ReadyPT, ${safeName}!</h2>
        <p>Your trainer profile has been reviewed and <strong>approved</strong>. You're now part of the ReadyPT network.</p>
        <p>Log in to your dashboard to view your live profile and stay updated as we launch the platform.</p>
        <a href="https://readyptsg.com/dashboard/trainer" style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Go to your dashboard
        </a>
      </div>
    `
  } else {
    subject = 'Update on your ReadyPT application'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${safeName},</h2>
        <p>Thank you for applying to ReadyPT. After reviewing your application, we're unable to approve your profile at this time.</p>
        ${safeNotes ? `<p style="background: #f5f5f5; padding: 12px 16px; border-radius: 6px; color: #333;"><strong>Note from our team:</strong> ${safeNotes}</p>` : ''}
        <p>If you have questions or would like to reapply, please contact us at <a href="mailto:support@readyptsg.com">support@readyptsg.com</a>.</p>
      </div>
    `
  }

  const resendPayload: Record<string, unknown> = { from: FROM_EMAIL, to: trainerEmail, subject, html }
  if (attachments.length > 0) resendPayload.attachments = attachments

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify(resendPayload),
  })

  if (!res.ok) {
    const errBody = await res.text()
    return new Response(JSON.stringify({ error: errBody }), { status: 500, headers: corsErrorHeaders })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
