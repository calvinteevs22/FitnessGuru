import { useState, useRef } from 'react'
import { validateFile } from '../utils/validation'

export default function FileUpload({ label, onChange, maxFiles = 5, required = false, files: controlledFiles }) {
  const [internalFiles, setInternalFiles] = useState([])
  const isControlled = controlledFiles !== undefined
  // In controlled mode, controlledFiles is a plain File[] array from the parent.
  // We wrap them with stable ids so the list can be rendered with keys.
  // We keep a parallel wrappedRef that mirrors what we last synced from controlledFiles.
  const wrappedRef = useRef([])
  const counterRef = useRef(0)

  // Derive the displayed file list. In controlled mode, sync wrappedRef to match controlledFiles.
  let files
  if (isControlled) {
    // Rebuild wrappedRef to match controlledFiles (preserve ids for existing files, assign new ones for new entries)
    const prev = wrappedRef.current
    const updated = controlledFiles.map(file => {
      const existing = prev.find(p => p.file === file)
      if (existing) return existing
      counterRef.current += 1
      return { id: Date.now() + counterRef.current, file }
    })
    wrappedRef.current = updated
    files = updated
  } else {
    files = internalFiles
  }

  const [errors, setErrors] = useState([])
  const inputRef = useRef(null)

  function handleChange(e) {
    setErrors([])
    const selected = Array.from(e.target.files)
    if (!selected.length) return

    const newErrors = []
    const validFiles = []
    selected.forEach((file, i) => {
      const validationError = validateFile(file)
      if (validationError) {
        newErrors.push(validationError)
      } else {
        counterRef.current += 1
        validFiles.push({ id: Date.now() + i + counterRef.current, file })
      }
    })

    if (newErrors.length) setErrors(newErrors)

    if (!validFiles.length) return

    if (files.length + validFiles.length > maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed.`])
      return
    }

    const updated = [...files, ...validFiles]
    if (isControlled) {
      onChange(updated.map(f => f.file))
    } else {
      setInternalFiles(updated)
      onChange(updated.map(f => f.file))
    }
    e.target.value = '' // reset input so same file can be re-added
  }

  function removeFile(id) {
    const updated = files.filter(f => f.id !== id)
    if (isControlled) {
      onChange(updated.map(f => f.file))
    } else {
      setInternalFiles(updated)
      onChange(updated.map(f => f.file))
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <label style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500 }}>
          {label}
        </label>
        {required && (
          <span style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12 }}>(required)</span>
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
        {...(maxFiles !== 1 && { multiple: true })}
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {errors.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0 }}>
          {errors.map((err, i) => (
            <li key={i} style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13 }}>{err}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
          {files.map((f) => (
            <li key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(238,242,238,0.06)' }}>
              <span style={{ flex: 1, color: 'rgba(238,242,238,0.8)', fontFamily: 'var(--font-body)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.file.name ?? f.file}
              </span>
              <button type="button" onClick={() => removeFile(f.id)}
                aria-label={`Remove ${f.file.name}`}
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
