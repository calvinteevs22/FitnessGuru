import { useState, useMemo } from 'react'

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function todaySGT() {
  return new Date(Date.now() + 8 * 3600000).toISOString().split('T')[0]
}

function formatTimeOnly(isoString) {
  return new Date(isoString).toLocaleTimeString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDayHeader(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-SG', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).toUpperCase()
}

export default function BookingCalendar({ slotDays, onSelect, selectedSlot }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  const todayStr = useMemo(todaySGT, [])
  // Earliest bookable = tomorrow SGT
  const minDate = useMemo(() => {
    const d = new Date(Date.now() + 8 * 3600000 + 86400000)
    return d.toISOString().split('T')[0]
  }, [])

  const availableSet = useMemo(() => new Set(slotDays.map(d => d.date)), [slotDays])
  const slotMap = useMemo(() => new Map(slotDays.map(d => [d.date, d])), [slotDays])

  // Build 6-row × 7-col grid of date strings (null = empty cell)
  const calendarCells = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells = Array(firstDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      cells.push(`${viewYear}-${mm}-${dd}`)
    }
    while (cells.length < 42) cells.push(null)
    return cells
  }, [viewYear, viewMonth])

  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth())

  function prevMonth() {
    if (!canGoPrev) return
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(dateStr) {
    if (!availableSet.has(dateStr) || dateStr < minDate) return
    setSelectedDate(dateStr)
    onSelect(null, null) // clear previously selected time slot
  }

  const dayEntry = selectedDate ? slotMap.get(selectedDate) : null

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

      {/* ── Calendar ── */}
      <div style={{ flex: '0 0 300px', minWidth: 280 }}>

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            style={{
              background: 'none', border: 'none', cursor: canGoPrev ? 'pointer' : 'default',
              color: canGoPrev ? 'rgba(238,242,238,0.7)' : 'rgba(238,242,238,0.2)',
              fontSize: 18, lineHeight: 1, padding: '4px 8px', borderRadius: 6,
              transition: 'color 0.15s',
            }}
            aria-label="Previous month"
          >
            ‹
          </button>
          <span style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15,
            color: '#EEF2EE', letterSpacing: '0.03em',
          }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(238,242,238,0.7)', fontSize: 18, lineHeight: 1,
              padding: '4px 8px', borderRadius: 6, transition: 'color 0.15s',
            }}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DAY_HEADERS.map((h, i) => (
            <div key={i} style={{
              textAlign: 'center', fontFamily: 'var(--font-body)',
              fontSize: 11, fontWeight: 600, color: 'rgba(238,242,238,0.3)',
              paddingBottom: 4,
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {calendarCells.map((dateStr, i) => {
            if (!dateStr) return <div key={i} />

            const isAvailable = availableSet.has(dateStr) && dateStr >= minDate
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === todayStr
            const isPast = dateStr < minDate

            let bg = 'transparent'
            let color = 'rgba(238,242,238,0.25)'
            let cursor = 'default'
            let border = 'none'

            if (isSelected) {
              bg = '#4ade80'
              color = '#0d1a0e'
            } else if (isAvailable) {
              color = '#EEF2EE'
              cursor = 'pointer'
            }

            if (isToday && !isSelected) {
              border = '1px solid rgba(238,242,238,0.3)'
            }

            const dayNum = parseInt(dateStr.split('-')[2])

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                disabled={!isAvailable}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  aspectRatio: '1',
                  background: bg,
                  color,
                  cursor,
                  border,
                  borderRadius: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 400,
                  transition: 'background 0.12s, color 0.12s',
                  padding: 0,
                  gap: 2,
                }}
                onMouseEnter={e => { if (isAvailable && !isSelected) e.currentTarget.style.background = 'rgba(74,222,128,0.12)' }}
                onMouseLeave={e => { if (isAvailable && !isSelected) e.currentTarget.style.background = 'transparent' }}
                aria-label={dateStr}
                aria-pressed={isSelected}
              >
                {dayNum}
                {/* Green availability dot */}
                {isAvailable && !isSelected && (
                  <div style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#4ade80', flexShrink: 0,
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.35)' }}>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: '#4ade80', display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.35)' }}>Selected</span>
          </div>
        </div>
      </div>

      {/* ── Time slots panel ── */}
      <div style={{ flex: 1, minWidth: 200 }}>
        {!selectedDate ? (
          <div style={{
            height: '100%', minHeight: 120,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px dashed rgba(238,242,238,0.1)', borderRadius: 10,
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.3)', margin: 0, textAlign: 'center' }}>
              ← Pick a date to see available times
            </p>
          </div>
        ) : !dayEntry ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.4)' }}>
            No slots available on this date.
          </p>
        ) : (
          <>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              color: 'rgba(238,242,238,0.45)', letterSpacing: '0.08em',
              textTransform: 'uppercase', margin: '0 0 12px',
            }}>
              {formatDayHeader(selectedDate)}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {dayEntry.slots.map(slot => {
                const isSelected = slot === selectedSlot
                return (
                  <button
                    key={slot}
                    onClick={() => onSelect(slot, dayEntry.duration_mins)}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: 14,
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      border: isSelected ? '1px solid #4ade80' : '1px solid rgba(74,222,128,0.2)',
                      background: isSelected ? '#4ade80' : 'rgba(74,222,128,0.06)',
                      color: isSelected ? '#0d1a0e' : '#4ade80',
                      fontWeight: isSelected ? 700 : 400,
                      transition: 'all 0.12s',
                      textAlign: 'center',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(74,222,128,0.12)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(74,222,128,0.06)' }}
                  >
                    {formatTimeOnly(slot)}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
