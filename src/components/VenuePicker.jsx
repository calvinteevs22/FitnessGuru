import { useState } from 'react'
import { ACTIVESG_REGIONS, ACTIVESG_GYMS } from '../data/activesg-gyms.js'

const VENUE_TYPES = [
  { key: 'condo_gym', label: 'Condo Gym' },
  { key: 'activesg', label: 'ActiveSG Gym' },
  { key: 'commercial_gym', label: 'Commercial Gym' },
  { key: 'outdoor', label: 'Outdoor' },
  { key: 'home', label: 'Home' },
  { key: 'other', label: 'Other' },
]

const TEXT_PLACEHOLDERS = {
  condo_gym: 'e.g. The Interlace, Depot Road',
  commercial_gym: 'e.g. Fitness First Raffles City',
  outdoor: 'e.g. East Coast Park near Carpark E2',
  home: 'e.g. Tampines',
  other: 'Describe the location',
}

const PILL_ACTIVE = {
  background: 'rgba(74,222,128,0.15)',
  border: '1px solid #4ade80',
  color: '#4ade80',
  borderRadius: 20,
  padding: '6px 14px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  cursor: 'pointer',
}

const PILL_INACTIVE = {
  background: 'transparent',
  border: '1px solid rgba(238,242,238,0.2)',
  color: 'rgba(238,242,238,0.6)',
  borderRadius: 20,
  padding: '6px 14px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  cursor: 'pointer',
}

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(238,242,238,0.15)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#EEF2EE',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const CONTAINER_STYLE = { marginTop: 12 }

export default function VenuePicker({ value, onChange }) {
  const [region, setRegion] = useState('')

  function handlePillClick(key) {
    setRegion('')
    onChange({ type: key, name: '' })
  }

  function handleRegionChange(e) {
    setRegion(e.target.value)
    onChange({ type: 'activesg', name: '' })
  }

  function handleGymChange(e) {
    onChange({ type: 'activesg', name: e.target.value })
  }

  function handleTextChange(e) {
    onChange({ type: value.type, name: e.target.value })
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {VENUE_TYPES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            style={value.type === key ? PILL_ACTIVE : PILL_INACTIVE}
            onClick={() => handlePillClick(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {value.type && value.type !== 'activesg' && (
        <div style={CONTAINER_STYLE}>
          <input
            type="text"
            style={INPUT_STYLE}
            placeholder={TEXT_PLACEHOLDERS[value.type]}
            value={value.name}
            onChange={handleTextChange}
          />
        </div>
      )}

      {value.type === 'activesg' && (
        <div style={CONTAINER_STYLE}>
          <select
            style={INPUT_STYLE}
            value={region}
            onChange={handleRegionChange}
          >
            <option value="">Select region</option>
            {ACTIVESG_REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {region && (
            <div style={{ marginTop: 8 }}>
              <select
                style={INPUT_STYLE}
                value={value.name}
                onChange={handleGymChange}
              >
                <option value="">Select gym</option>
                {ACTIVESG_GYMS[region].map(gym => (
                  <option key={gym} value={gym}>{gym}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
