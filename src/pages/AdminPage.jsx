import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const PAGE_STYLE = { minHeight: '100vh', background: '#0d1a0e', padding: '40px 24px' }
const CONTAINER = { maxWidth: 900, margin: '0 auto' }
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const TAB_BTN = (active) => ({
  background: active ? '#4ade80' : 'transparent',
  color: active ? '#0d1a0e' : 'rgba(238,242,238,0.6)',
  border: `1px solid ${active ? '#4ade80' : 'rgba(238,242,238,0.2)'}`,
  borderRadius: 6, padding: '8px 20px', fontSize: 14, fontFamily: 'var(--font-body)',
  fontWeight: active ? 700 : 400, cursor: 'pointer',
})
const FIELD_LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 2 }
const FIELD_VAL = { color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 12 }

export default function AdminPage() {
  const { signOut } = useAuth()
  const [tab, setTab] = useState('pending')
  const [trainers, setTrainers] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [actionStates, setActionStates] = useState({})
  const [notes, setNotes] = useState({})
  const [expandedDocs, setExpandedDocs] = useState({})
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function fetchTrainers() {
      setLoading(true)
      const { data: tps } = await supabase
        .from('trainer_profiles')
        .select('*')
        .eq('status', tab)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (!tps?.length) { setTrainers([]); setLoading(false); return }

      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, phone, profile_photo_url, bio')
        .in('id', tps.map(t => t.id))

      if (cancelled) return

      const profMap = {}
      profs?.forEach(p => { profMap[p.id] = p })

      setTrainers(tps)
      setProfiles(profMap)
      setLoading(false)
    }
    fetchTrainers()
    return () => { cancelled = true }
  }, [tab, reloadKey])

  async function approve(trainerId) {
    setActionStates(s => ({ ...s, [trainerId]: 'approving' }))
    const { error } = await supabase
      .from('trainer_profiles')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), admin_notes: notes[trainerId] ?? null })
      .eq('id', trainerId)

    if (!error) {
      await supabase.functions.invoke('notify-trainer', {
        body: {
          trainerId,
          trainerName: profiles[trainerId]?.full_name ?? 'Trainer',
          status: 'approved',
          adminNotes: notes[trainerId] ?? null,
        },
      })
      setReloadKey(k => k + 1)
    }
    setActionStates(s => ({ ...s, [trainerId]: null }))
  }

  async function reject(trainerId) {
    setActionStates(s => ({ ...s, [trainerId]: 'rejecting' }))
    const { error } = await supabase
      .from('trainer_profiles')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString(), admin_notes: notes[trainerId] ?? null })
      .eq('id', trainerId)

    if (!error) {
      await supabase.functions.invoke('notify-trainer', {
        body: {
          trainerId,
          trainerName: profiles[trainerId]?.full_name ?? 'Trainer',
          status: 'rejected',
          adminNotes: notes[trainerId] ?? null,
        },
      })
      setReloadKey(k => k + 1)
    }
    setActionStates(s => ({ ...s, [trainerId]: null }))
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={CONTAINER}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 36, color: '#EEF2EE', fontWeight: 700, letterSpacing: 1, margin: 0 }}>
            Admin Dashboard
          </h1>
          <button onClick={signOut}
            style={{ background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['pending', 'approved', 'rejected'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={TAB_BTN(tab === t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)' }}>Loading…</p>}

        {!loading && trainers.length === 0 && (
          <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 15, padding: '40px 0' }}>
            No {tab} applications.
          </p>
        )}

        {!loading && trainers.map(trainer => {
          const prof = profiles[trainer.id] ?? {}
          const docsExpanded = expandedDocs[trainer.id]
          const acting = actionStates[trainer.id]

          return (
            <div key={trainer.id} style={CARD}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {prof.profile_photo_url && (
                  <img src={prof.profile_photo_url} alt={prof.full_name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: '#EEF2EE', fontWeight: 700, margin: '0 0 4px', letterSpacing: 0.5 }}>
                    {prof.full_name ?? 'Unknown'}
                  </h3>
                  <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, margin: 0 }}>
                    Applied {new Date(trainer.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <div>
                  <span style={FIELD_LABEL}>Phone</span>
                  <p style={FIELD_VAL}>{prof.phone ?? '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Experience</span>
                  <p style={FIELD_VAL}>{trainer.years_experience ? `${trainer.years_experience} years` : '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Specialties</span>
                  <p style={FIELD_VAL}>{trainer.specialties?.join(', ') || '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Hourly rate</span>
                  <p style={FIELD_VAL}>{trainer.hourly_rate ? `$${trainer.hourly_rate} SGD` : '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Session types</span>
                  <p style={FIELD_VAL}>{trainer.session_types?.join(', ') || '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Locations</span>
                  <p style={FIELD_VAL}>{trainer.locations_served?.join(', ') || '—'}</p>
                </div>
                {prof.bio && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={FIELD_LABEL}>Bio</span>
                    <p style={{ ...FIELD_VAL, lineHeight: 1.6 }}>{prof.bio}</p>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 16, marginTop: 4 }}>
                <button onClick={() => setExpandedDocs(s => ({ ...s, [trainer.id]: !s[trainer.id] }))}
                  style={{ background: 'transparent', border: 'none', color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: docsExpanded ? 12 : 0 }}>
                  {docsExpanded ? '▲ Hide documents' : '▼ View documents'}
                </button>

                {docsExpanded && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    {Object.entries(trainer.documents ?? {}).map(([type, urls]) => (
                      urls?.length > 0 && (
                        <div key={type}>
                          <span style={FIELD_LABEL}>{type.replace(/_/g, ' ')}</span>
                          {urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, textDecoration: 'none', marginBottom: 2 }}>
                              Document {i + 1} →
                            </a>
                          ))}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>

              {tab === 'pending' && (
                <div style={{ borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 16, marginTop: 16 }}>
                  <label style={{ ...FIELD_LABEL, marginBottom: 6 }}>Admin notes (included in rejection email)</label>
                  <textarea
                    value={notes[trainer.id] ?? ''}
                    onChange={e => setNotes(s => ({ ...s, [trainer.id]: e.target.value }))}
                    rows={2}
                    placeholder="Optional — add a note visible to you and sent to trainer if rejected…"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 6, padding: '8px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, marginBottom: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => approve(trainer.id)} disabled={!!acting}
                      style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: acting ? 'default' : 'pointer', opacity: acting === 'approving' ? 0.6 : 1 }}>
                      {acting === 'approving' ? 'Approving…' : 'Approve'}
                    </button>
                    <button onClick={() => reject(trainer.id)} disabled={!!acting}
                      style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', borderRadius: 6, padding: '10px 20px', fontSize: 14, fontFamily: 'var(--font-body)', cursor: acting ? 'default' : 'pointer', opacity: acting === 'rejecting' ? 0.6 : 1 }}>
                      {acting === 'rejecting' ? 'Rejecting…' : 'Reject'}
                    </button>
                  </div>
                </div>
              )}

              {tab !== 'pending' && trainer.reviewed_at && (
                <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12, marginTop: 12, borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 12 }}>
                  Reviewed {new Date(trainer.reviewed_at).toLocaleDateString('en-SG')}
                  {trainer.admin_notes && ` · Note: ${trainer.admin_notes}`}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
