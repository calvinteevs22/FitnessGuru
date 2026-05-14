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

  let body: { trainerName?: string; trainerEmail?: string; status?: string; adminNotes?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: corsErrorHeaders })
  }
  const { trainerName, trainerEmail, status, adminNotes } = body

  if (!trainerEmail || !status) {
    return new Response(JSON.stringify({ error: 'trainerEmail and status are required' }), { status: 400, headers: corsErrorHeaders })
  }

  const safeName = escapeHtml(trainerName ?? 'Trainer')
  const safeNotes = adminNotes ? escapeHtml(adminNotes) : null

  let subject: string
  let html: string

  if (status === 'submitted') {
    subject = 'Application received — FitnessGuru'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${safeName}, we've got your application!</h2>
        <p>Thanks for applying to join FitnessGuru as a trainer. Your profile is now under review and we'll get back to you within 48 hours.</p>
        <p>In the meantime, you can log in to your dashboard to check your status.</p>
        <a href="https://fitness-guru-seven.vercel.app/dashboard/trainer" style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View your dashboard
        </a>
      </div>
    `
  } else if (status === 'approved') {
    subject = '🎉 Your FitnessGuru application has been approved!'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Welcome to FitnessGuru, ${safeName}!</h2>
        <p>Your trainer profile has been reviewed and <strong>approved</strong>. You're now part of the FitnessGuru network.</p>
        <p>Log in to your dashboard to view your live profile and stay updated as we launch the platform.</p>
        <a href="https://fitness-guru-seven.vercel.app/dashboard/trainer" style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Go to your dashboard
        </a>
      </div>
    `
  } else {
    subject = 'Update on your FitnessGuru application'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${safeName},</h2>
        <p>Thank you for applying to FitnessGuru. After reviewing your application, we're unable to approve your profile at this time.</p>
        ${safeNotes ? `<p style="background: #f5f5f5; padding: 12px 16px; border-radius: 6px; color: #333;"><strong>Note from our team:</strong> ${safeNotes}</p>` : ''}
        <p>If you have questions or would like to reapply, please contact us at <a href="mailto:support@fitnessguru.sg">support@fitnessguru.sg</a>.</p>
      </div>
    `
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: trainerEmail, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    return new Response(JSON.stringify({ error: body }), { status: 500, headers: corsErrorHeaders })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
