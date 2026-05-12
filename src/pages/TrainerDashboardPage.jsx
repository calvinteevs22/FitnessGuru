import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const PAGE_STYLE = { minHeight: '100vh', background: '#0d1a0e', padding: '40px 24px' }
const CONTAINER = { maxWidth: 680, margin: '0 auto' }
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '28px 32px', marginBottom: 20 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'block' }
const VALUE = { color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 15, marginBottom: 16 }

const STATUS_COLORS = {
  pending:  { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.4)', text: '#fbbf24' },
  approved: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.4)', text: '#4ade80' },
  rejected: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)', text: '#f87171' },
}

const STATUS_MESSAGES = {
  pending: 'Your application is under review. We\'ll get back to you within 48 hours.',
  approved: 'Your profile is approved and live. Clients can find you on FitnessGuru.',
  rejected: 'Your application was not approved at this time.',
}

export default function TrainerDashboardPage() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [trainerProfile, setTrainerProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')

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

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 8) { setPwMsg('Password must be at least 8 characters.'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwMsg(error.message)
    else { setPwMsg('Password updated.'); setNewPassword(''); setChangingPassword(false) }
  }

  if (loading) {
    return (
      <div style={{ ...PAGE_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)' }}>Loading…</p>
      </div>
    )
  }

  if (!trainerProfile) {
    return (
      <div style={{ ...PAGE_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 16 }}>Profile not found.</p>
        <button onClick={() => navigate('/profile/setup')} style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '10px 20px', fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }}>
          Complete your profile
        </button>
      </div>
    )
  }

  const status = trainerProfile.status
  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.pending

  return (
    <div style={PAGE_STYLE}>
      <div style={CONTAINER}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 36, color: '#EEF2EE', fontWeight: 700, margin: '0 0 4px', letterSpacing: 1 }}>
              {profile?.full_name ?? 'Your Dashboard'}
            </h1>
            <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, margin: 0 }}>
              {session?.user?.email}
            </p>
          </div>
          <button onClick={handleSignOut}
            style={{ background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>

        {/* Status banner */}
        <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10, padding: '18px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ background: sc.text, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#0d1a0e', textTransform: 'uppercase', letterSpacing: 1 }}>
              {status}
            </span>
          </div>
          <p style={{ color: sc.text, fontFamily: 'var(--font-body)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
            {STATUS_MESSAGES[status]}
          </p>
          {status === 'rejected' && trainerProfile.admin_notes && (
            <p style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 8, fontStyle: 'italic' }}>
              Note: {trainerProfile.admin_notes}
            </p>
          )}
        </div>

        {/* Profile summary */}
        <div style={CARD}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#EEF2EE', margin: '0 0 20px', fontWeight: 700 }}>Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div>
              <span style={LABEL}>Specialties</span>
              <p style={VALUE}>{trainerProfile.specialties?.join(', ') || '—'}</p>
            </div>
            <div>
              <span style={LABEL}>Experience</span>
              <p style={VALUE}>{trainerProfile.years_experience ? `${trainerProfile.years_experience} years` : '—'}</p>
            </div>
            <div>
              <span style={LABEL}>Hourly rate</span>
              <p style={VALUE}>{trainerProfile.hourly_rate ? `$${trainerProfile.hourly_rate} SGD` : '—'}</p>
            </div>
            <div>
              <span style={LABEL}>Session types</span>
              <p style={VALUE}>{trainerProfile.session_types?.join(', ') || '—'}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={LABEL}>Locations</span>
              <p style={VALUE}>{trainerProfile.locations_served?.join(', ') || '—'}</p>
            </div>
            {profile?.bio && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={LABEL}>Bio</span>
                <p style={{ ...VALUE, lineHeight: 1.6 }}>{profile.bio}</p>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/profile/setup')}
            style={{ marginTop: 8, background: 'transparent', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            Edit profile
          </button>
        </div>

        {/* Documents */}
        <div style={CARD}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#EEF2EE', margin: '0 0 16px', fontWeight: 700 }}>Documents</h3>
          {Object.entries(trainerProfile.documents ?? {}).map(([type, urls]) => (
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
          ))}
        </div>

        {/* Account settings */}
        <div style={CARD}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#EEF2EE', margin: '0 0 16px', fontWeight: 700 }}>Account</h3>
          <span style={LABEL}>Email</span>
          <p style={{ ...VALUE, marginBottom: 16 }}>{session?.user?.email}</p>

          {!changingPassword ? (
            <button onClick={() => setChangingPassword(true)}
              style={{ background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
              Change password
            </button>
          ) : (
            <form onSubmit={handleChangePassword}>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                  Update
                </button>
                <button type="button" onClick={() => { setChangingPassword(false); setPwMsg('') }}
                  style={{ background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
              {pwMsg && <p style={{ color: pwMsg === 'Password updated.' ? '#4ade80' : '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 8 }}>{pwMsg}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
