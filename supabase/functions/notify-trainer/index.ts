import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@fitnessguru.sg'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    })
  }

  const { trainerName, trainerEmail, status, adminNotes } = await req.json()

  if (!trainerEmail || !status) {
    return new Response(JSON.stringify({ error: 'trainerEmail and status are required' }), { status: 400 })
  }

  const approved = status === 'approved'

  const subject = approved
    ? '🎉 Your FitnessGuru application has been approved!'
    : 'Update on your FitnessGuru application'

  const html = approved
    ? `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Welcome to FitnessGuru, ${trainerName ?? 'Trainer'}!</h2>
        <p>Your trainer profile has been reviewed and <strong>approved</strong>. You're now part of the FitnessGuru network.</p>
        <p>Log in to your dashboard to view your live profile and stay updated as we launch the platform.</p>
        <a href="https://fitnessguru.sg/login" style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Go to your dashboard
        </a>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${trainerName ?? 'Trainer'},</h2>
        <p>Thank you for applying to FitnessGuru. After reviewing your application, we're unable to approve your profile at this time.</p>
        ${adminNotes ? `<p style="background: #f5f5f5; padding: 12px 16px; border-radius: 6px; color: #333;"><strong>Note from our team:</strong> ${adminNotes}</p>` : ''}
        <p>If you have questions or would like to reapply, please contact us at <a href="mailto:support@fitnessguru.sg">support@fitnessguru.sg</a>.</p>
      </div>
    `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: trainerEmail, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    return new Response(JSON.stringify({ error: body }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
