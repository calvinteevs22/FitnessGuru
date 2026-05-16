// src/components/TrainerProfilePreview.jsx

function PlaceholderBar({ width }) {
  return (
    <div style={{ height: 14, width, background: 'rgba(255,255,255,0.07)', borderRadius: 4 }} />
  )
}

export default function TrainerProfilePreview({ profile = {} }) {
  const {
    name = '',
    photoUrl = '',
    specialties = [],
    yearsExp = '',
    hourlyRate = '',
    locations = [],
    bio = '',
  } = profile

  const requiredFields = [
    !!name.trim(),
    !!photoUrl,
    specialties.length > 0,
    !!yearsExp,
    !!hourlyRate,
    locations.length > 0,
    !!bio.trim(),
  ]
  const filled = requiredFields.filter(Boolean).length
  const pct = Math.round((filled / requiredFields.length) * 100)
  const isComplete = pct === 100

  const initials = name.trim()
    ? name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const displayLocations = locations.length > 0
    ? locations.slice(0, 2).join(', ') + (locations.length > 2 ? ` +${locations.length - 2}` : '')
    : null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(238,242,238,0.1)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Completion progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: isComplete ? '#4ade80' : '#2D6A27',
          transition: 'width 0.2s ease',
        }} />
      </div>

      <div style={{ padding: '24px 24px 20px' }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(238,242,238,0.35)', margin: '0 0 16px',
        }}>
          Client preview
        </p>

        {/* Avatar + name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: 'linear-gradient(135deg, #14532d, #166534)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {photoUrl
              ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: '#EEF2EE' }}>{initials}</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {name.trim()
              ? <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: '#EEF2EE', margin: 0 }}>{name.trim()}</p>
              : <PlaceholderBar width="70%" />
            }
            <div style={{ marginTop: 6 }}>
              {yearsExp
                ? <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.45)', margin: 0 }}>
                    {yearsExp} yr{Number(yearsExp) !== 1 ? 's' : ''} experience
                  </p>
                : <PlaceholderBar width="40%" />
              }
            </div>
          </div>
        </div>

        {/* Specialties */}
        {specialties.length > 0
          ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {specialties.map(s => (
                <span key={s} style={{
                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
                  borderRadius: 20, padding: '3px 10px',
                  fontFamily: 'var(--font-body)', fontSize: 12, color: '#4ade80',
                }}>
                  {s}
                </span>
              ))}
            </div>
          : <div style={{ marginBottom: 12 }}><PlaceholderBar width="80%" /></div>
        }

        {/* Bio */}
        {bio.trim()
          ? <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.65)',
              lineHeight: 1.6, margin: '0 0 16px',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {bio.trim()}
            </p>
          : <div style={{ marginBottom: 16 }}>
              <PlaceholderBar width="100%" />
              <div style={{ marginTop: 6 }}><PlaceholderBar width="75%" /></div>
            </div>
        }

        {/* Footer: locations + rate */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {displayLocations
              ? <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.45)', margin: 0 }}>
                  {`📍 ${displayLocations}`}
                </p>
              : <PlaceholderBar width="50%" />
            }
          </div>
          <div style={{ flexShrink: 0 }}>
            {hourlyRate
              ? <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#EEF2EE', margin: 0 }}>${hourlyRate}/hr</p>
              : <PlaceholderBar width="48px" />
            }
          </div>
        </div>
      </div>
    </div>
  )
}
