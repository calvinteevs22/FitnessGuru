import { describe, it, expect } from 'vitest'
import { generateSlots, formatSlotSGT } from './slotGenerator.js'

// Helper: build an availability row
function avail(day_of_week, start_time = '09:00', end_time = '12:00', duration_mins = 60) {
  return { day_of_week, start_time, end_time, duration_mins }
}

describe('generateSlots', () => {
  it('returns empty array when trainer has no availability', () => {
    expect(generateSlots([], [], [])).toEqual([])
  })

  it('generates slots for a matching day of week', () => {
    // Find what day of week is 1 day from now in SGT (UTC+8)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dow = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000).getUTCDay()

    const result = generateSlots([avail(dow, '09:00', '11:00', 60)], [], [], 1)
    expect(result).toHaveLength(1)
    expect(result[0].slots).toHaveLength(2) // 09:00 and 10:00
    expect(result[0].duration_mins).toBe(60)
  })

  it('skips blocked dates', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const sgtTomorrow = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000)
    const dateStr = sgtTomorrow.toISOString().split('T')[0]
    const dow = sgtTomorrow.getUTCDay()

    const result = generateSlots(
      [avail(dow, '09:00', '10:00', 60)],
      [{ blocked_date: dateStr }],
      [],
      1
    )
    expect(result).toHaveLength(0)
  })

  it('filters out already-booked slots', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const sgtTomorrow = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000)
    const dow = sgtTomorrow.getUTCDay()

    // Build the ISO for the 09:00 SGT slot (09:00 SGT = 01:00 UTC)
    const bookedSlot = new Date(sgtTomorrow)
    bookedSlot.setUTCHours(1, 0, 0, 0)
    const bookedISO = bookedSlot.toISOString()

    const result = generateSlots(
      [avail(dow, '09:00', '11:00', 60)],
      [],
      [{ scheduled_at: bookedISO }],
      1
    )
    expect(result[0].slots).toHaveLength(1) // only 10:00 slot remains
    expect(result[0].slots[0]).not.toBe(bookedISO)
  })

  it('does not include today (starts from tomorrow)', () => {
    const today = new Date()
    const dow = new Date(today.getTime() + 8 * 60 * 60 * 1000).getUTCDay()
    const result = generateSlots([avail(dow, '09:00', '10:00', 60)], [], [], 1)
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('formatSlotSGT', () => {
  it('formats an ISO string as a human-readable SGT time', () => {
    // 2026-01-01 01:00:00 UTC = 09:00 SGT
    const iso = '2026-01-01T01:00:00.000Z'
    const result = formatSlotSGT(iso)
    expect(result).toContain('09:00')
  })
})
