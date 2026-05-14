import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcal(str: string): string {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const trainerId = url.searchParams.get('trainer_id')

  if (!trainerId) {
    return new Response('Missing trainer_id', { status: 400, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Fetch trainer name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', trainerId)
    .single()

  const trainerName = profile?.full_name ?? 'Your Trainer'

  // Fetch confirmed bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, client_name, scheduled_at, duration_mins, notes')
    .eq('trainer_id', trainerId)
    .eq('status', 'confirmed')
    .order('scheduled_at', { ascending: true })

  if (error) {
    return new Response('Error fetching bookings', { status: 500, headers: corsHeaders })
  }

  const now = new Date()
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitnessGuru//Trainer Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:FitnessGuru — ${escapeIcal(trainerName)}`,
    'X-WR-TIMEZONE:Asia/Singapore',
  ]

  for (const booking of bookings ?? []) {
    const start = new Date(booking.scheduled_at)
    const end = new Date(start.getTime() + booking.duration_mins * 60 * 1000)

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${booking.id}@fitnessguru.sg`)
    lines.push(`DTSTAMP:${formatICalDate(now)}`)
    lines.push(`DTSTART:${formatICalDate(start)}`)
    lines.push(`DTEND:${formatICalDate(end)}`)
    lines.push(`SUMMARY:Session with ${escapeIcal(booking.client_name)}`)
    if (booking.notes) {
      lines.push(`DESCRIPTION:${escapeIcal(booking.notes)}`)
    }
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return new Response(lines.join('\r\n'), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fitnessguru-schedule.ics"',
    },
  })
})
