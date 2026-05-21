// src/components/MilestoneBadges.jsx

const BADGES = [
  { key: 'first', label: 'First weigh-in logged', icon: '📋', threshold: null },
  { key: 'quarter', label: 'Quarter of the way', icon: '🔥', threshold: 0.25 },
  { key: 'half', label: 'Halfway there', icon: '⚡', threshold: 0.5 },
  { key: 'three_quarter', label: '75% to goal', icon: '💪', threshold: 0.75 },
  { key: 'goal', label: 'Goal reached!', icon: '🏆', threshold: 1.0 },
]

export default function MilestoneBadges({ maxProgress, hasMetrics }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {BADGES.map(badge => {
        const earned = badge.threshold === null ? hasMetrics : maxProgress >= badge.threshold
        return (
          <div
            key={badge.key}
            style={{
              flex: '0 0 auto',
              background: earned ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${earned ? 'rgba(74,222,128,0.3)' : 'rgba(238,242,238,0.08)'}`,
              borderRadius: 10,
              padding: '10px 14px',
              textAlign: 'center',
              minWidth: 110,
              opacity: earned ? 1 : 0.45,
              transition: 'all 0.3s',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{badge.icon}</div>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
              color: earned ? '#4ade80' : 'rgba(238,242,238,0.5)',
              margin: 0, lineHeight: 1.3,
            }}>
              {badge.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
