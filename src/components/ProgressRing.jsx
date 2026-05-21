// src/components/ProgressRing.jsx

export default function ProgressRing({ progress, size = 100, strokeWidth = 8, color = '#4ade80', value, unit, label }) {
  const clampedProgress = Math.min(1, Math.max(0, progress))
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - clampedProgress)
  const cx = size / 2
  const cy = size / 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: size, height: size,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: size * 0.22, color: '#EEF2EE', lineHeight: 1 }}>
            {value}<span style={{ fontSize: size * 0.14, color: 'rgba(238,242,238,0.6)' }}>{unit}</span>
          </span>
          {label && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: size * 0.11, color: 'rgba(238,242,238,0.4)', marginTop: 2, textAlign: 'center' }}>
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
