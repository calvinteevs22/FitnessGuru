import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Spinner = () => (
  <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 15 }}>Loading…</p>
  </div>
)

export default function ProtectedRoute({ children, requiredRole }) {
  const { session, profile, loading } = useAuth()

  // Still initialising auth or fetching profile — wait
  if (loading) return <Spinner />

  // No session → send to login
  if (!session) return <Navigate to="/login" replace />

  // Role check: profile is now definitively loaded (not undefined)
  if (requiredRole) {
    // profile is null = row doesn't exist in profiles table
    if (profile === null) return <Navigate to="/" replace />
    // Admin can access any role-gated page
    if (profile.role !== requiredRole && profile.role !== 'admin') return <Navigate to="/" replace />
  }

  return children
}
