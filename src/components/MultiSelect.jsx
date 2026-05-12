import { useState } from 'react'

export default function MultiSelect({ label, options, value = [], onChange, allowCustom = false }) {
  const [customInput, setCustomInput] = useState('')

  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setCustomInput('')
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const selected = value.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              style={{
                background: selected ? '#4ade80' : 'rgba(255,255,255,0.06)',
                color: selected ? '#0d1a0e' : 'rgba(238,242,238,0.8)',
                border: `1px solid ${selected ? '#4ade80' : 'rgba(238,242,238,0.2)'}`,
                borderRadius: 20, padding: '6px 14px', fontSize: 13,
                fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: selected ? 600 : 400,
              }}>
              {opt}
            </button>
          )
        })}
      </div>

      {allowCustom && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            placeholder="Add custom…"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)',
              borderRadius: 6, padding: '8px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)',
              fontSize: 14, outline: 'none',
            }}
          />
          <button type="button" onClick={addCustom}
            style={{
              background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)',
              color: '#4ade80', borderRadius: 6, padding: '8px 14px', fontSize: 14,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
            }}>
            Add
          </button>
        </div>
      )}

      {allowCustom && value.filter(v => !options.includes(v)).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {value.filter(v => !options.includes(v)).map(v => (
            <span key={v} style={{
              background: '#4ade80', color: '#0d1a0e', borderRadius: 20,
              padding: '6px 14px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {v}
              <button type="button" onClick={() => onChange(value.filter(x => x !== v))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d1a0e', fontSize: 14, lineHeight: 1, padding: 0 }}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
