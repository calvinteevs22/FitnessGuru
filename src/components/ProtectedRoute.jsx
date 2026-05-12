import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requiredRole }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 16 }}>Loading...</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (requiredRole && profile?.role !== requiredRole) return <Navigate to="/" replace />

  return children
}
