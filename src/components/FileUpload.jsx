import { useState, useRef } from 'react'
import { validateFile } from '../utils/validation'

export default function FileUpload({ label, onChange, files = [], maxFiles = 5, optional = false }) {
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  function handleChange(e) {
    setError('')
    const selected = Array.from(e.target.files)
    if (!selected.length) return

    const validationError = validateFile(selected[0])
    if (validationError) { setError(validationError); return }

    if (files.length + selected.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`)
      return
    }

    onChange([...files, ...selected])
    e.target.value = '' // reset input so same file can be re-added
  }

  function removeFile(index) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <label style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500 }}>
          {label}
        </label>
        {optional && (
          <span style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12 }}>optional</span>
        )}
      </div>

      <button type="button" onClick={() => inputRef.current?.click()}
        style={{
          background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(74,222,128,0.4)',
          borderRadius: 6, padding: '10px 16px', color: '#4ade80', fontFamily: 'var(--font-body)',
          fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}>
        + Add file
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {error && (
        <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 4 }}>{error}</p>
      )}

      {files.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
          {files.map((file, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(238,242,238,0.06)' }}>
              <span style={{ flex: 1, color: 'rgba(238,242,238,0.8)', fontFamily: 'var(--font-body)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name ?? file}
              </span>
              <button type="button" onClick={() => removeFile(i)}
                style={{ background: 'none', border: 'none', color: 'rgba(238,242,238,0.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ color: 'rgba(238,242,238,0.3)', fontFamily: 'var(--font-body)', fontSize: 12, marginTop: 4 }}>
        PDF, JPG, or PNG · Max 5MB per file · Up to {maxFiles} files
      </p>
    </div>
  )
}
