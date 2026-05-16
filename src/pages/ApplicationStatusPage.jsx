import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const STEPS = ['Submitted', 'Docs OK', 'Confirmed', 'Live']

const STATUS_CONFIG = {
  pending: {
    filledDots: 1,
    message: 'Under review — usually 3–5 business days',
    subtext: 'Our team reviews every application carefully.',
    ctaText: null,
    ctaHref: null,
  },
  docs_verified: {
    filledDots: 2,
    message: 'Documents verified — final approval in progress',
    subtext: 'Almost there. Approval typically follows within 24 hours.',
    ctaText: null,
    ctaHref: null,
  },
  approved: {
    filledDots: 3,
    message: 'Approved! Set your availability to go live',
    subtext: "Your profile is ready. Add your first available slots and you'll appear in client searches.",
    ctaText: 'Set your first available slots to go live →',
    ctaHref: '/dashboard/trainer',
  },
  rejected: {
    filledDots: 0,
    message: 'Application not approved',
    subtext: null,
    ctaText: 'Re-upload documents →',
    ctaHref: '/profile/setup',
  },
}

export default function ApplicationStatusPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [trainerStatus, setTrainerStatus] = useState(null)
  const [applicationRef, setApplicationRef] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchStatus() {
    if (!session?.user?.id) return
    const { data, error } = await supabase
      .from('trainer_profiles')
      .select('status, application_ref, rejection_reason')
      .eq('id', session.user.id)
      .single()
    if (!error && data) {
      setTrainerStatus(data.status)
      setApplicationRef(data.application_ref || '')
      setRejectionReason(data.rejection_reason || '')
      if (data.status === 'live') {
        navigate('/dashboard/trainer', { replace: true })
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 14 }}>Loading…</p>
      </div>
    )
  }

  const config = STATUS_CONFIG[trainerStatus] || STATUS_CONFIG.pending
  const isRejected = trainerStatus === 'rejected'
  const dotColor = isRejected ? '#f87171' : '#4ade80'

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', padding: '60px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)',
        borderRadius: 12, padding: '40px 36px', height: 'fit-content',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            Application status
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#EEF2EE', margin: '0 0 10px', fontWeight: 700, lineHeight: 1.3 }}>
            {config.message}
          </h1>
          {config.subtext && (
            <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {config.subtext}
            </p>
          )}
          {isRejected && rejectionReason && (
            <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 6, lineHeight: 1.5 }}>
              {rejectionReason}
            </p>
          )}
        </div>

        {/* 4-dot progress indicator (hidden when rejected) */}
        {!isRejected && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
            {STEPS.map((label, i) => {
              const isFilled = i < config.filledDots
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: isFilled ? dotColor : 'rgba(255,255,255,0.12)',
                      border: isFilled ? 'none' : '2px solid rgba(255,255,255,0.15)',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 10,
                      color: isFilled ? 'rgba(238,242,238,0.7)' : 'rgba(238,242,238,0.25)',
                      letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, margin: '0 4px', marginBottom: 22,
                      background: i < config.filledDots - 1 ? dotColor : 'rgba(255,255,255,0.1)',
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {config.ctaText && (
          <a
            href={config.ctaHref}
            style={{
              display: 'block', textAlign: 'center',
              background: trainerStatus === 'approved' ? '#4ade80' : 'rgba(255,255,255,0.06)',
              color: trainerStatus === 'approved' ? '#0d1a0e' : '#EEF2EE',
              borderRadius: 6, padding: '14px 24px',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {config.ctaText}
          </a>
        )}

        {/* Reference number */}
        {applicationRef && (
          <p style={{ color: 'rgba(238,242,238,0.25)', fontFamily: 'var(--font-body)', fontSize: 12, marginTop: 32, textAlign: 'center' }}>
            Ref {applicationRef}
          </p>
        )}
      </div>
    </div>
  )
}
