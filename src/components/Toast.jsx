import { useState, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [])

  const ToastEl = toast ? (
    <div
      key={toast.id}
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
        background: toast.type === 'error' ? 'rgba(127,29,29,0.97)' : 'rgba(20,83,45,0.97)',
        border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.5)' : 'rgba(74,222,128,0.45)'}`,
        borderRadius: 12, padding: '13px 20px',
        fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
        color: toast.type === 'error' ? '#fca5a5' : '#86efac',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        animation: 'toast-in 0.2s ease-out',
        display: 'flex', alignItems: 'center', gap: 10,
        maxWidth: 320,
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>
        {toast.type === 'error' ? '✕' : '✓'}
      </span>
      {toast.message}
    </div>
  ) : null

  return { showToast, ToastEl }
}
