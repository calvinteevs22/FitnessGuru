import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * Calendar for trainers to block/unblock specific dates.
 *
 * Props:
 *   trainerId        — string
 *   availabilityDays — Set<number>  (0=Sun…6=Sat), days trainer has a schedule
 *   blocks           — Array<{ id, blocked_date }>
 *   onBlocksChange   — (newBlocks) => void
 */
export default function TrainerBlockCalendar({ trainerId, availabilityDays, blocks, onBlocksChange }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [saving, setSaving] = useState(null) // dateStr currently being toggled

  // Today's date string (local, not SGT — trainer is in SG anyway)
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [])

  const blockedSet = useMemo(
    () => new Map(blocks.map(b => [b.blocked_date, b.id])),
    [blocks]
  )

  // Build 6-row × 7-col grid
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

  async function toggleDate(dateStr) {
    if (saving) return
    setSaving(dateStr)
    try {
      if (blockedSet.has(dateStr)) {
        // Unblock
        const blockId = blockedSet.get(dateStr)
        await supabase.from('availability_blocks').delete().eq('id', blockId)
        onBlocksChange(blocks.filter(b => b.id !== blockId))
      } else {
        // Block
        const { data, error } = await supabase
          .from('availability_blocks')
          .insert({ trainer_id: trainerId, blocked_date: dateStr })
          .select()
          .single()
        if (!error && data) {
          onBlocksChange([...blocks, data].sort((a, b) => a.blocked_date.localeCompare(b.blocked_date)))
        }
      }
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{
            background: 'none', border: 'none',
            cursor: canGoPrev ? 'pointer' : 'default',
            color: canGoPrev ? 'rgba(238,242,238,0.7)' : 'rgba(238,242,238,0.2)',
            fontSize: 20, lineHeight: 1, padding: '4px 10px', borderRadius: 6,
          }}
          aria-label="Previous month"
        >‹</button>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: '#EEF2EE', letterSpacing: '0.03em' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(238,242,238,0.7)', fontSize: 20, lineHeight: 1, padding: '4px 10px', borderRadius: 6,
          }}
          aria-label="Next month"
        >›</button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {DAY_HEADERS.map((h, i) => (
          <div key={i} style={{
            textAlign: 'center', fontFamily: 'var(--font-body)',
            fontSize: 11, fontWeight: 600, color: 'rgba(238,242,238,0.3)', paddingBottom: 4,
          }}>{h}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {calendarCells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} />

          const dow = new Date(dateStr + 'T00:00:00').getDay()
          const isPast = dateStr <= todayStr
          const hasSchedule = availabilityDays.has(dow)
          const isBlocked = blockedSet.has(dateStr)
          const isToday = dateStr === todayStr
          const isSaving = saving === dateStr
          const isClickable = !isPast && hasSchedule

          let bg = 'transparent'
          let color = 'rgba(238,242,238,0.2)'
          let cursor = 'default'
          let border = 'none'
          let dotColor = null

          if (isPast) {
            color = 'rgba(238,242,238,0.15)'
          } else if (isBlocked) {
            bg = 'rgba(248,113,113,0.18)'
            color = '#f87171'
            border = '1px solid rgba(248,113,113,0.35)'
            cursor = 'pointer'
          } else if (hasSchedule) {
            color = '#EEF2EE'
            cursor = 'pointer'
            dotColor = '#4ade80'
          }

          if (isToday && !isBlocked) {
            border = '1px solid rgba(238,242,238,0.3)'
          }

          const dayNum = parseInt(dateStr.split('-')[2])

          return (
            <button
              key={dateStr}
              onClick={() => isClickable && toggleDate(dateStr)}
              disabled={!isClickable || isSaving}
              title={
                isPast ? '' :
                !hasSchedule ? 'No schedule on this day' :
                isBlocked ? 'Click to unblock' :
                'Click to block'
              }
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                aspectRatio: '1', background: bg, color,
                cursor: isSaving ? 'wait' : cursor,
                border, borderRadius: 6,
                fontFamily: 'var(--font-body)', fontSize: 13,
                transition: 'background 0.12s, color 0.12s',
                padding: 0, gap: 2,
                opacity: isSaving ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                if (!isClickable || isSaving) return
                if (isBlocked) e.currentTarget.style.background = 'rgba(248,113,113,0.28)'
                else e.currentTarget.style.background = 'rgba(248,113,113,0.1)'
              }}
              onMouseLeave={e => {
                if (!isClickable || isSaving) return
                e.currentTarget.style.background = isBlocked ? 'rgba(248,113,113,0.18)' : 'transparent'
              }}
              aria-label={dateStr}
            >
              {dayNum}
              {dotColor && !isBlocked && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              )}
              {isBlocked && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.35)' }}>Available — click to block</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.35)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.35)' }}>Blocked — click to unblock</span>
        </div>
      </div>
    </div>
  )
}
