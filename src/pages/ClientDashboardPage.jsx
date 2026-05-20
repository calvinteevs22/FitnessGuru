import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { formatSlotSGT } from '../utils/slotGenerator.js'
import ClientPlanTab from './ClientPlanTab'
import ClientProgressTab from './ClientProgressTab'

const STATUS_COLOR = {
  confirmed: '#4ade80',
  pending: '#fbbf24',
  cancelled: 'rgba(238,242,238,0.3)',
  completed: 'rgba(74,222,128,0.5)',
}

function canCancel(scheduledAt) {
  const sessionTime = new Date(scheduledAt).getTime()
  const now = Date.now()
  return sessionTime - now > 24 * 60 * 60 * 1000
}

export default function ClientDashboardPage() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)
  const [cancelError, setCancelError] = useState(null)
  const [activeTab, setActiveTab] = useState('bookings')

  const CLIENT_TABS = [
    { key: 'bookings', label: 'My Bookings' },
    { key: 'plan', label: 'My Plan' },
    { key: 'progress', label: 'My Progress' },
  ]

  const fetchBookings = useCallback(async () => {
    if (!session) return
    const { data } = await supabase
      .from('bookings')
      .select('*, trainer_profiles!inner(profiles!inner(full_name))')
      .eq('client_id', session.user.id)
      .order('scheduled_at', { ascending: false })
    setBookings(data ?? [])
    setLoading(false)
  }, [session])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  async function handleCancel(bookingId) {
    setCancelling(bookingId)
    setCancelError(null)
    try {
      const { data, error } = await supabase.functions.invoke('cancel-booking', {
        body: { booking_id: bookingId },
      })
      if (error || data?.error) throw new Error(error?.message ?? data?.error ?? 'Cancel failed')
      fetchBookings()
    } catch (e) {
      setCancelError(e.message)
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)' }}>Loading…</p>
      </div>
    )
  }

  const active = bookings.filter(b => ['confirmed', 'pending'].includes(b.status))
  const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status))

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {profile?.role === 'admin' && (
          <a href="/admin" style={{ display: 'inline-block', marginBottom: 20, color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, textDecoration: 'none' }}>
            ← Back to Admin
          </a>
        )}
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 36,
          color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 8,
        }}>
          My Bookings
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.45)', fontSize: 15, marginBottom: 28 }}>
          {session?.user?.email}
        </p>

        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
          {CLIENT_TABS.map(t => (
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

        {activeTab === 'bookings' && (
          <>
            {cancelError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                <p style={{ fontFamily: 'var(--font-body)', color: '#f87171', fontSize: 14, margin: 0 }}>{cancelError}</p>
              </div>
            )}

            {/* Upcoming */}
            <Section title="Upcoming">
              {active.length === 0
                ? <Empty text="No upcoming bookings." action="Browse trainers" onAction={() => navigate('/trainers')} />
                : active.map(b => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onCancel={canCancel(b.scheduled_at) ? handleCancel : null}
                      cancelling={cancelling === b.id}
                    />
                  ))
              }
            </Section>

            {/* Past */}
            {past.length > 0 && (
              <Section title="Past">
                {past.map(b => <BookingCard key={b.id} booking={b} />)}
              </Section>
            )}
          </>
        )}

        {activeTab === 'plan' && <ClientPlanTab clientId={session.user.id} />}
        {activeTab === 'progress' && <ClientProgressTab clientId={session.user.id} />}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
        color: 'rgba(238,242,238,0.4)', textTransform: 'uppercase', letterSpacing: 2,
        marginBottom: 16,
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function BookingCard({ booking, onCancel, cancelling }) {
  const trainerName = booking.trainer_profiles?.profiles?.full_name ?? 'Trainer'
  const status = booking.status
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(238,242,238,0.07)',
      borderRadius: 12, padding: '20px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      opacity: status === 'cancelled' ? 0.5 : 1,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#EEF2EE', textTransform: 'uppercase' }}>
            {trainerName}
          </span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
            color: STATUS_COLOR[status] ?? '#EEF2EE',
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {status}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.6)' }}>
          {formatSlotSGT(booking.scheduled_at)} · {booking.duration_mins} min
        </div>
        {booking.venue_name && (
          <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, margin: '2px 0 0' }}>
            {booking.venue_name}
          </p>
        )}
        {booking.amount_sgd && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.35)', marginTop: 3 }}>
            S${((booking.amount_sgd) / 100).toFixed(0)} paid
          </div>
        )}
      </div>
      {onCancel && status === 'confirmed' && (
        <button
          onClick={() => onCancel(booking.id)}
          disabled={cancelling}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            background: 'none', color: '#f87171',
            border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6,
            padding: '8px 16px', cursor: cancelling ? 'not-allowed' : 'pointer',
            opacity: cancelling ? 0.5 : 1,
          }}
        >
          {cancelling ? 'Cancelling…' : 'Cancel & Refund'}
        </button>
      )}
      {status === 'confirmed' && !onCancel && (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.3)' }}>
          Cannot cancel within 24h
        </span>
      )}
    </div>
  )
}

function Empty({ text, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)', fontSize: 15, marginBottom: 16 }}>{text}</p>
      {action && (
        <button
          onClick={onAction}
          style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
            textTransform: 'uppercase', letterSpacing: 1,
            background: '#4ade80', color: '#0d1a0e',
            border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
          }}
        >
          {action}
        </button>
      )}
    </div>
  )
}
