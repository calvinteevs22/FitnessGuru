/**
 * Generate available booking slots for a trainer over the next `daysAhead` days.
 *
 * @param {Array} availability  - rows from trainer_availability table
 * @param {Array} blocks        - rows from availability_blocks table
 * @param {Array} confirmedBookings - rows from bookings with { scheduled_at }
 * @param {number} daysAhead    - how many days ahead to look (default 30)
 * @returns {Array<{ date: string, duration_mins: number, slots: string[] }>}
 *   date is YYYY-MM-DD in SGT; slots are UTC ISO strings
 */
export function generateSlots(availability, blocks, confirmedBookings, daysAhead = 30) {
  const blockDates = new Set(blocks.map(b => b.blocked_date))
  const bookedISOs = new Set(confirmedBookings.map(b => b.scheduled_at))
  const result = []

  for (let i = 1; i <= daysAhead; i++) {
    const utcBase = new Date()
    utcBase.setDate(utcBase.getDate() + i)
    utcBase.setUTCHours(0, 0, 0, 0)

    // Compute SGT date (UTC+8)
    const sgtBase = new Date(utcBase.getTime() + 8 * 60 * 60 * 1000)
    const dateStr = sgtBase.toISOString().split('T')[0]   // YYYY-MM-DD in SGT
    const dayOfWeek = sgtBase.getUTCDay()                  // 0=Sun...6=Sat in SGT

    const avail = availability.find(a => a.day_of_week === dayOfWeek)
    if (!avail) continue
    if (blockDates.has(dateStr)) continue

    const [startH, startM] = avail.start_time.split(':').map(Number)
    const [endH, endM] = avail.end_time.split(':').map(Number)
    const startMins = startH * 60 + startM  // minutes since midnight SGT
    const endMins = endH * 60 + endM

    const daySlots = []
    for (let mins = startMins; mins + avail.duration_mins <= endMins; mins += avail.duration_mins) {
      // Convert SGT minutes to UTC: subtract 8 hours (480 minutes)
      const utcMins = mins - 480
      // Build UTC slot datetime using the SGT date's year/month/day
      // Date.UTC handles negative hours correctly by rolling back the date
      const slot = new Date(Date.UTC(
        sgtBase.getUTCFullYear(),
        sgtBase.getUTCMonth(),
        sgtBase.getUTCDate(),
        Math.floor(utcMins / 60),
        utcMins % 60,
        0, 0
      ))
      const slotISO = slot.toISOString()
      if (!bookedISOs.has(slotISO)) {
        daySlots.push(slotISO)
      }
    }

    if (daySlots.length > 0) {
      result.push({ date: dateStr, duration_mins: avail.duration_mins, slots: daySlots })
    }
  }

  return result
}

/**
 * Format a UTC ISO string as a human-readable time in Singapore timezone.
 * e.g. "Thu, 22 May, 09:00 AM"
 */
export function formatSlotSGT(isoString) {
  return new Date(isoString).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a YYYY-MM-DD date string for display headers.
 * e.g. "Thursday, 22 May"
 */
export function formatDateHeader(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-SG', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
