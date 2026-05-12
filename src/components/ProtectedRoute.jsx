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

  // If a role is required but profile hasn't loaded yet, show loading
  // (profile is null while fetchProfile is still in flight after login)
  if (requiredRole && profile === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 16 }}>Loading...</p>
      </div>
    )
  }

  if (requiredRole && profile.role !== requiredRole) return <Navigate to="/" replace />

  return children
}
