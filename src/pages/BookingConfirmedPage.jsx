import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { formatSlotSGT } from '../utils/slotGenerator.js'

export default function BookingConfirmedPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = searchParams.get('booking_id')

  const [booking, setBooking] = useState(null)
  const [trainerName, setTrainerName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('bookings')
        .select('*, trainer_profiles!inner(profiles!inner(full_name))')
        .eq('id', bookingId)
        .single()
      if (data) {
        setBooking(data)
        setTrainerName(data.trainer_profiles?.profiles?.full_name ?? 'your trainer')
      }
      setLoading(false)
    }
    load()
  }, [bookingId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        {/* Success icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none"
            stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12l5 5 11-11" />
          </svg>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32,
          color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 12,
        }}>
          You're booked!
        </h1>

        {booking ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(238,242,238,0.08)',
            borderRadius: 12, padding: '24px', marginTop: 24, textAlign: 'left',
          }}>
            <Row label="Trainer" value={trainerName} />
            <Row label="When" value={formatSlotSGT(booking.scheduled_at)} />
            {booking.venue_name && <Row label="Where" value={booking.venue_name} />}
            <Row label="Duration" value={`${booking.duration_mins} minutes`} />
            <Row label="Amount paid" value={`S$${((booking.amount_sgd ?? 0) / 100).toFixed(0)}`} />
            <Row label="Confirmation sent to" value={booking.client_email} />
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.5)', marginTop: 16 }}>
            Your booking with {trainerName || 'your trainer'} is confirmed. Check your email for details.
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          <button
            onClick={() => navigate('/dashboard/client')}
            style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: 1,
              background: '#4ade80', color: '#0d1a0e',
              border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer',
            }}
          >
            My Bookings
          </button>
          <button
            onClick={() => navigate('/trainers')}
            style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: 1,
              background: 'none', color: 'rgba(238,242,238,0.6)',
              border: '1px solid rgba(238,242,238,0.15)', borderRadius: 8,
              padding: '12px 24px', cursor: 'pointer',
            }}
          >
            Find Another Trainer
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(238,242,238,0.05)' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.45)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#EEF2EE', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )
}
