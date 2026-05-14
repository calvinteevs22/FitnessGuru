import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { generateSlots, formatSlotSGT, formatDateHeader } from '../utils/slotGenerator.js'
import VenuePicker from '../components/VenuePicker.jsx'

export default function TrainerProfilePage() {
  const { id } = useParams()
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [trainer, setTrainer] = useState(null)
  const [slotDays, setSlotDays] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState(searchParams.get('error') ?? null)
  const [venue, setVenue] = useState({ type: null, name: '' })
  const [venueError, setVenueError] = useState(false)

  useEffect(() => {
    async function load() {
      const [
        { data: tp },
        { data: avail },
        { data: blocks },
        { data: bookings },
      ] = await Promise.all([
        supabase
          .from('trainer_profiles')
          .select('*, profiles!inner(full_name, bio, profile_photo_url)')
          .eq('id', id)
          .single(),
        supabase.from('trainer_availability').select('*').eq('trainer_id', id),
        supabase.from('availability_blocks').select('*').eq('trainer_id', id),
        supabase
          .from('bookings')
          .select('scheduled_at')
          .eq('trainer_id', id)
          .eq('status', 'confirmed'),
      ])

      setTrainer(tp)
      const days = generateSlots(avail ?? [], blocks ?? [], bookings ?? [])
      setSlotDays(days)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleBook() {
    if (!session) {
      navigate(`/login?redirect=/trainer/${id}`)
      return
    }
    if (!selectedSlot) return
    if (!venue.type || !venue.name.trim()) {
      setVenueError(true)
      return
    }
    setVenueError(false)
    setBooking(true)
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout', {
        body: {
          trainer_id: id,
          scheduled_at: selectedSlot,
          duration_mins: selectedDuration,
          client_name: profile?.full_name ?? session.user.email,
          client_email: session.user.email,
          venue_type: venue.type,
          venue_name: venue.name.trim(),
        },
      })
      if (fnErr || !data?.session_url) {
        throw new Error(fnErr?.message ?? 'Could not start checkout')
      }
      window.location.href = data.session_url
    } catch (e) {
      setError(e.message)
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)' }}>Loading…</p>
      </div>
    )
  }

  if (!trainer) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)' }}>Trainer not found.</p>
      </div>
    )
  }

  const name = trainer.profiles?.full_name ?? 'Trainer'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/trainers')}
          style={{ background: 'none', border: 'none', color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 32 }}
        >
          ← Back to trainers
        </button>

        {/* Trainer header */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #14532d, #166534)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, color: '#EEF2EE',
          }}>
            {trainer.profiles?.profile_photo_url
              ? <img src={trainer.profiles.profile_photo_url} alt={name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32, color: '#EEF2EE', textTransform: 'uppercase', margin: 0 }}>
              {name}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.6)', fontSize: 15, marginTop: 6 }}>
              {trainer.profiles?.bio}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', color: '#4ade80', fontSize: 18, fontWeight: 700, marginTop: 8 }}>
              S${trainer.hourly_rate}/hr
            </p>
          </div>
        </div>

        {/* Specialties */}
        {(trainer.specialties ?? []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
            {trainer.specialties.map(s => (
              <span key={s} style={{
                fontFamily: 'var(--font-body)', fontSize: 13,
                background: 'rgba(74,222,128,0.08)', color: '#4ade80',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 20, padding: '4px 12px',
              }}>{s}</span>
            ))}
          </div>
        )}

        {/* Slot picker */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
          Book a Session
        </h2>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-body)', color: '#f87171', fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        )}

        {slotDays.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)', fontSize: 15 }}>
            No available slots in the next 30 days.
          </p>
        )}

        {slotDays.map(day => (
          <div key={day.date} style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'rgba(238,242,238,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              {formatDateHeader(day.date)}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {day.slots.map(slot => {
                const isSelected = selectedSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => { setSelectedSlot(slot); setSelectedDuration(day.duration_mins); setVenue({ type: null, name: '' }); setVenueError(false) }}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: 14,
                      padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                      border: isSelected ? '1px solid #4ade80' : '1px solid rgba(238,242,238,0.15)',
                      background: isSelected ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#4ade80' : 'rgba(238,242,238,0.8)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {formatSlotSGT(slot)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {selectedSlot && (
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(238,242,238,0.08)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginTop: 0 }}>
              Where would you like to train?
            </h2>
            <VenuePicker value={venue} onChange={setVenue} />
            {venueError && (
              <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, margin: '8px 0 0' }}>
                Please select a venue type and enter a location.
              </p>
            )}
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.7)', marginBottom: 16 }}>
              <strong style={{ color: '#EEF2EE' }}>Selected:</strong> {formatSlotSGT(selectedSlot)} · {selectedDuration} min · S${Math.round(trainer.hourly_rate * (selectedDuration / 60))}
            </p>
            <button
              onClick={handleBook}
              disabled={booking}
              style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16,
                textTransform: 'uppercase', letterSpacing: 1,
                background: booking ? 'rgba(74,222,128,0.5)' : '#4ade80',
                color: '#0d1a0e', border: 'none', borderRadius: 8,
                padding: '14px 32px', cursor: booking ? 'not-allowed' : 'pointer',
              }}
            >
              {booking ? 'Redirecting to payment…' : 'Book & Pay'}
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', marginTop: 10 }}>
              Secure checkout via Stripe. Full refund if cancelled 24+ hours before session.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
