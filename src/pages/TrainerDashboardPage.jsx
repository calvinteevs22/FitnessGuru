import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

/* ─── Styles ─────────────────────────────────────────────────── */
const PAGE = { minHeight: '100vh', background: '#0d1a0e', padding: '40px 24px' }
const WRAP = { maxWidth: 820, margin: '0 auto' }
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '28px 32px', marginBottom: 20 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'block' }
const VALUE = { color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 15, marginBottom: 16 }
const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
const BTN_GREEN = { background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const BTN_RED = { background: 'transparent', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }

const STATUS_COLORS = {
  pending:  { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.4)', text: '#fbbf24' },
  approved: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.4)', text: '#4ade80' },
  rejected: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)', text: '#f87171' },
}
const STATUS_MESSAGES = {
  pending: "Your application is under review. We'll get back to you within 48 hours.",
  approved: 'Your profile is approved and live. Clients can find you on FitnessGuru.',
  rejected: 'Your application was not approved at this time.',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/* ─── Helpers ─────────────────────────────────────────────────── */
function generateSlots(startTime, endTime, durationMins) {
  const slots = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let cur = sh * 60 + sm
  const end = eh * 60 + em
  while (cur + durationMins <= end) {
    const h = Math.floor(cur / 60)
    const m = cur % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    cur += durationMins
  }
  return slots
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
}

function isToday(iso) {
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function isNext7Days(iso) {
  const d = new Date(iso)
  const now = new Date()
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return d >= now && d <= in7
}

/* ─── Appointments Tab ────────────────────────────────────────── */
function AppointmentsTab({ trainerId }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('trainer_id', trainerId)
      .in('status', ['confirmed', 'completed'])
      .order('scheduled_at', { ascending: true })
    setBookings(data ?? [])
    setLoading(false)
  }, [trainerId])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  async function handleCancel(id) {
    await supabase.rpc('cancel_booking', { p_booking_id: id })
    fetchBookings()
  }

  async function handleComplete(id) {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', id)
    fetchBookings()
  }

  if (loading) return <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)' }}>Loading…</p>

  const todayBookings = bookings.filter(b => isToday(b.scheduled_at) && b.status === 'confirmed')
  const upcomingBookings = bookings.filter(b => isNext7Days(b.scheduled_at) && !isToday(b.scheduled_at) && b.status === 'confirmed')

  function BookingCard({ b }) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(238,242,238,0.07)', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#EEF2EE', textTransform: 'uppercase' }}>{b.client_name}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.5)', marginTop: 3 }}>{formatDateTime(b.scheduled_at)} · {b.duration_mins} min</div>
          {b.client_email && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', marginTop: 2 }}>{b.client_email}</div>}
          {b.notes && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.45)', marginTop: 4, fontStyle: 'italic' }}>"{b.notes}"</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={BTN_RED} onClick={() => handleCancel(b.id)}>Cancel</button>
          <button style={{ ...BTN_GHOST, fontSize: 12, padding: '6px 12px' }} onClick={() => handleComplete(b.id)}>Mark done</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Today</h3>
        {todayBookings.length === 0
          ? <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 14 }}>No sessions today.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{todayBookings.map(b => <BookingCard key={b.id} b={b} />)}</div>}
      </div>
      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: 'rgba(238,242,238,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Next 7 Days</h3>
        {upcomingBookings.length === 0
          ? <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 14 }}>No upcoming sessions.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{upcomingBookings.map(b => <BookingCard key={b.id} b={b} />)}</div>}
      </div>
    </div>
  )
}

/* ─── Availability Tab ────────────────────────────────────────── */
function AvailabilityTab({ trainerId }) {
  const [availability, setAvailability] = useState({})
  const [blocks, setBlocks] = useState([])
  const [duration, setDuration] = useState(60)
  const [newBlockDate, setNewBlockDate] = useState('')
  const [saving, setSaving] = useState(null)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const icalUrl = `${supabaseUrl}/functions/v1/trainer-calendar?trainer_id=${trainerId}`

  useEffect(() => {
    async function load() {
      const [{ data: avail }, { data: blks }] = await Promise.all([
        supabase.from('trainer_availability').select('*').eq('trainer_id', trainerId),
        supabase.from('availability_blocks').select('*').eq('trainer_id', trainerId).order('blocked_date'),
      ])
      const map = {}
      for (const row of avail ?? []) {
        map[row.day_of_week] = { start_time: row.start_time, end_time: row.end_time, duration_mins: row.duration_mins }
        if (row.duration_mins) setDuration(row.duration_mins)
      }
      setAvailability(map)
      setBlocks(blks ?? [])
    }
    load()
  }, [trainerId])

  async function toggleDay(dayIdx) {
    if (availability[dayIdx]) {
      await supabase.rpc('delete_trainer_availability', { p_day_of_week: dayIdx })
      setAvailability(prev => { const n = { ...prev }; delete n[dayIdx]; return n })
    } else {
      const defaults = { start_time: '08:00', end_time: '17:00', duration_mins: duration }
      await supabase.rpc('upsert_trainer_availability', {
        p_day_of_week: dayIdx,
        p_start_time: defaults.start_time,
        p_end_time: defaults.end_time,
        p_duration_mins: duration,
      })
      setAvailability(prev => ({ ...prev, [dayIdx]: defaults }))
    }
  }

  async function saveDayTimes(dayIdx) {
    setSaving(dayIdx)
    const av = availability[dayIdx]
    await supabase.rpc('upsert_trainer_availability', {
      p_day_of_week: dayIdx,
      p_start_time: av.start_time,
      p_end_time: av.end_time,
      p_duration_mins: duration,
    })
    setSaving(null)
    setMsg('Saved.')
    setTimeout(() => setMsg(''), 2000)
  }

  function updateDayField(dayIdx, field, value) {
    setAvailability(prev => ({ ...prev, [dayIdx]: { ...prev[dayIdx], [field]: value } }))
  }

  async function updateDuration(val) {
    setDuration(val)
    for (const dayIdx of Object.keys(availability)) {
      await supabase.rpc('upsert_trainer_availability', {
        p_day_of_week: Number(dayIdx),
        p_start_time: availability[dayIdx].start_time,
        p_end_time: availability[dayIdx].end_time,
        p_duration_mins: val,
      })
    }
  }

  async function addBlock() {
    if (!newBlockDate) return
    const { data, error } = await supabase
      .from('availability_blocks')
      .insert({ trainer_id: trainerId, blocked_date: newBlockDate })
      .select()
      .single()
    if (!error) {
      setBlocks(prev => [...prev, data].sort((a, b) => a.blocked_date.localeCompare(b.blocked_date)))
      setNewBlockDate('')
    }
  }

  async function removeBlock(id) {
    await supabase.from('availability_blocks').delete().eq('id', id)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  function copyIcal() {
    navigator.clipboard.writeText(icalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div>
      {/* Session duration */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#EEF2EE', fontWeight: 700, margin: '0 0 16px' }}>Session Duration</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          {[60, 90].map(d => (
            <button key={d} onClick={() => updateDuration(d)} style={{
              padding: '10px 24px', borderRadius: 8,
              border: `1px solid ${duration === d ? 'rgba(74,222,128,0.55)' : 'rgba(238,242,238,0.15)'}`,
              background: duration === d ? 'rgba(74,222,128,0.1)' : 'transparent',
              color: duration === d ? '#4ade80' : 'rgba(238,242,238,0.55)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
            }}>{d} min</button>
          ))}
        </div>
      </div>

      {/* Weekly template */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#EEF2EE', fontWeight: 700, margin: '0 0 8px' }}>Weekly Schedule</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.4)', margin: '0 0 20px' }}>Toggle days you're available and set your hours.</p>
        {msg && <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, margin: '0 0 12px' }}>{msg}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DAYS.map((day, idx) => {
            const active = !!availability[idx]
            const av = availability[idx]
            const slots = active ? generateSlots(av.start_time, av.end_time, duration) : []
            return (
              <div key={idx} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 10,
                background: active ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? 'rgba(74,222,128,0.18)' : 'rgba(238,242,238,0.06)'}`,
                transition: 'all 0.2s',
              }}>
                <button onClick={() => toggleDay(idx)} style={{
                  width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                  flexShrink: 0, marginTop: 2,
                  background: active ? '#4ade80' : 'rgba(238,242,238,0.12)',
                  transition: 'background 0.2s', position: 'relative',
                }}>
                  <span style={{ position: 'absolute', top: 3, left: active ? 18 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
                <div style={{ width: 36, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: active ? '#EEF2EE' : 'rgba(238,242,238,0.3)', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 2 }}>{day}</div>
                {active ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
                    <input type="time" value={av.start_time} onChange={e => updateDayField(idx, 'start_time', e.target.value)} style={{ ...INPUT, width: 120 }} />
                    <span style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)' }}>to</span>
                    <input type="time" value={av.end_time} onChange={e => updateDayField(idx, 'end_time', e.target.value)} style={{ ...INPUT, width: 120 }} />
                    <button onClick={() => saveDayTimes(idx)} style={{ ...BTN_GREEN, padding: '8px 14px', fontSize: 12 }}>
                      {saving === idx ? 'Saving…' : 'Save'}
                    </button>
                    {slots.length > 0 && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)' }}>
                        {slots.length} slot{slots.length !== 1 ? 's' : ''}: {formatTime(slots[0])} – {formatTime(slots[slots.length - 1])}
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.25)', paddingTop: 2 }}>Off</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Block dates */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#EEF2EE', fontWeight: 700, margin: '0 0 8px' }}>Block Dates</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.4)', margin: '0 0 16px' }}>Mark specific dates as unavailable — holidays, personal days, etc.</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input type="date" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ ...INPUT, width: 180 }} />
          <button style={BTN_GREEN} onClick={addBlock}>Block date</button>
        </div>
        {blocks.length === 0
          ? <p style={{ color: 'rgba(238,242,238,0.25)', fontFamily: 'var(--font-body)', fontSize: 13 }}>No blocked dates.</p>
          : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {blocks.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, padding: '6px 12px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#f87171' }}>
                    {new Date(b.blocked_date + 'T00:00:00').toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button onClick={() => removeBlock(b.id)} style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.6)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* iCal export */}
      <div style={CARD}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#EEF2EE', fontWeight: 700, margin: '0 0 8px' }}>Calendar Sync</h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.4)', margin: '0 0 16px', lineHeight: 1.6 }}>
          Subscribe to this URL in Google Calendar or Apple Calendar. Your FitnessGuru sessions will appear automatically.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input readOnly value={icalUrl} style={{ ...INPUT, fontSize: 12, color: 'rgba(238,242,238,0.5)', cursor: 'text' }} />
          <button style={{ ...BTN_GREEN, flexShrink: 0 }} onClick={copyIcal}>{copied ? 'Copied!' : 'Copy URL'}</button>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.3)', margin: '10px 0 0', lineHeight: 1.6 }}>
          Google Calendar: Other calendars → + → From URL → paste → Add calendar.
        </p>
      </div>
    </div>
  )
}

/* ─── Profile Tab ─────────────────────────────────────────────── */
function ProfileTab({ trainerProfile, profile, session, navigate }) {
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  const status = trainerProfile.status
  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.pending

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 8) { setPwMsg('Password must be at least 8 characters.'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwMsg(error.message)
    else { setPwMsg('Password updated.'); setNewPassword(''); setChangingPassword(false) }
  }

  return (
    <div>
      <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10, padding: '18px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ background: sc.text, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#0d1a0e', textTransform: 'uppercase', letterSpacing: 1 }}>{status}</span>
        </div>
        <p style={{ color: sc.text, fontFamily: 'var(--font-body)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>{STATUS_MESSAGES[status]}</p>
        {status === 'rejected' && trainerProfile.admin_notes && (
          <p style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 8, fontStyle: 'italic' }}>Note: {trainerProfile.admin_notes}</p>
        )}
      </div>

      <div style={CARD}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#EEF2EE', margin: '0 0 20px', fontWeight: 700 }}>Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <div><span style={LABEL}>Specialties</span><p style={VALUE}>{trainerProfile.specialties?.join(', ') || '—'}</p></div>
          <div><span style={LABEL}>Experience</span><p style={VALUE}>{trainerProfile.years_experience ? `${trainerProfile.years_experience} years` : '—'}</p></div>
          <div><span style={LABEL}>Hourly rate</span><p style={VALUE}>{trainerProfile.hourly_rate ? `$${trainerProfile.hourly_rate} SGD` : '—'}</p></div>
          <div><span style={LABEL}>Session types</span><p style={VALUE}>{trainerProfile.session_types?.join(', ') || '—'}</p></div>
          <div style={{ gridColumn: '1 / -1' }}><span style={LABEL}>Locations</span><p style={VALUE}>{trainerProfile.locations_served?.join(', ') || '—'}</p></div>
          {profile?.bio && <div style={{ gridColumn: '1 / -1' }}><span style={LABEL}>Bio</span><p style={{ ...VALUE, lineHeight: 1.6 }}>{profile.bio}</p></div>}
        </div>
        <button onClick={() => navigate('/profile/setup')} style={{ ...BTN_GHOST, marginTop: 8 }}>Edit profile</button>
      </div>

      <div style={CARD}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#EEF2EE', margin: '0 0 16px', fontWeight: 700 }}>Documents</h3>
        {Object.entries(trainerProfile.documents ?? {}).map(([type, urls]) =>
          urls?.length > 0 && (
            <div key={type} style={{ marginBottom: 12 }}>
              <span style={LABEL}>{type.replace(/_/g, ' ')}</span>
              {urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 14, textDecoration: 'none', marginBottom: 4 }}>
                  View document {i + 1} →
                </a>
              ))}
            </div>
          )
        )}
      </div>

      <div style={CARD}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#EEF2EE', margin: '0 0 16px', fontWeight: 700 }}>Account</h3>
        <span style={LABEL}>Email</span>
        <p style={{ ...VALUE, marginBottom: 16 }}>{session?.user?.email}</p>
        {!changingPassword
          ? <button onClick={() => setChangingPassword(true)} style={BTN_GHOST}>Change password</button>
          : (
            <form onSubmit={handleChangePassword}>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 characters)" style={{ ...INPUT, marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={BTN_GREEN}>Update</button>
                <button type="button" onClick={() => { setChangingPassword(false); setPwMsg('') }} style={BTN_GHOST}>Cancel</button>
              </div>
              {pwMsg && <p style={{ color: pwMsg === 'Password updated.' ? '#4ade80' : '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 8 }}>{pwMsg}</p>}
            </form>
          )}
      </div>
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function TrainerDashboardPage() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [trainerProfile, setTrainerProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (!session) { setLoading(false); return }
    supabase
      .from('trainer_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (!error) setTrainerProfile(data)
        setLoading(false)
      })
  }, [session])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div style={{ ...PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)' }}>Loading…</p>
      </div>
    )
  }

  if (!trainerProfile) {
    return (
      <div style={{ ...PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 16 }}>Profile not found.</p>
        <button onClick={() => navigate('/profile/setup')} style={BTN_GREEN}>Complete your profile</button>
      </div>
    )
  }

  const TABS = [
    { key: 'profile', label: 'Profile' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'availability', label: 'Availability' },
  ]

  return (
    <div style={PAGE}>
      <div style={WRAP}>
        {profile?.role === 'admin' && (
          <a href="/admin" style={{ display: 'inline-block', marginBottom: 20, color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, textDecoration: 'none' }}>
            ← Back to Admin
          </a>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 36, color: '#EEF2EE', fontWeight: 700, margin: '0 0 4px', letterSpacing: 1 }}>
              {profile?.full_name ?? 'Your Dashboard'}
            </h1>
            <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, margin: 0 }}>{session?.user?.email}</p>
          </div>
          <button onClick={handleSignOut} style={BTN_GHOST}>Sign out</button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              flex: 1, padding: '10px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase',
              background: activeTab === t.key ? 'rgba(74,222,128,0.12)' : 'transparent',
              color: activeTab === t.key ? '#4ade80' : 'rgba(238,242,238,0.45)',
              borderBottom: activeTab === t.key ? '2px solid #4ade80' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'profile' && <ProfileTab trainerProfile={trainerProfile} profile={profile} session={session} navigate={navigate} />}
        {activeTab === 'appointments' && <AppointmentsTab trainerId={session.user.id} />}
        {activeTab === 'availability' && <AvailabilityTab trainerId={session.user.id} />}
      </div>
    </div>
  )
}
