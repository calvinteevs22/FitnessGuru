import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(238,242,238,0.08)',
  borderRadius: 12,
  padding: '24px',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
}

export default function TrainerListingPage() {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('trainer_profiles')
        .select(`
          id,
          specialties,
          years_experience,
          hourly_rate,
          session_types,
          locations_served,
          profiles!inner(full_name, profile_photo_url, bio)
        `)
        .eq('status', 'approved')
      if (!error) setTrainers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', padding: '80px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 40,
          fontWeight: 800,
          color: '#EEF2EE',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}>
          Find a Trainer
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.55)', fontSize: 16, marginBottom: 48 }}>
          All trainers are certified and vetted by our team.
        </p>

        {loading && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)', fontSize: 15 }}>
            Loading…
          </p>
        )}

        {!loading && trainers.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)', fontSize: 15 }}>
            No approved trainers yet.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {trainers.map(t => {
            const name = t.profiles?.full_name ?? 'Trainer'
            const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            return (
              <div
                key={t.id}
                style={CARD_STYLE}
                onClick={() => navigate(`/trainer/${t.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(74,222,128,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(238,242,238,0.08)'}
              >
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #14532d, #166534)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18,
                    color: '#EEF2EE', textTransform: 'uppercase',
                  }}>
                    {t.profiles?.profile_photo_url
                      ? <img src={t.profiles.profile_photo_url} alt={name}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <h2 style={{
                        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20,
                        color: '#EEF2EE', textTransform: 'uppercase', margin: 0,
                      }}>
                        {name}
                      </h2>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700,
                        color: '#4ade80',
                      }}>
                        S${t.hourly_rate}/hr
                      </span>
                    </div>

                    {t.profiles?.bio && (
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: 14,
                        color: 'rgba(238,242,238,0.6)', margin: '6px 0 10px',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {t.profiles.bio}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(t.specialties ?? []).slice(0, 4).map(s => (
                        <span key={s} style={{
                          fontFamily: 'var(--font-body)', fontSize: 12,
                          background: 'rgba(74,222,128,0.08)', color: '#4ade80',
                          border: '1px solid rgba(74,222,128,0.2)',
                          borderRadius: 20, padding: '3px 10px',
                        }}>
                          {s}
                        </span>
                      ))}
                      {t.years_experience && (
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 12,
                          color: 'rgba(238,242,238,0.4)', padding: '3px 0',
                        }}>
                          {t.years_experience} yr{t.years_experience !== 1 ? 's' : ''} exp
                        </span>
                      )}
                    </div>

                    {(t.locations_served ?? []).length > 0 && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', marginTop: 6 }}>
                        {t.locations_served.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
