import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ProtectedRoute from './ProtectedRoute'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))
import { useAuth } from '../hooks/useAuth'

describe('ProtectedRoute', () => {
  it('shows loading indicator while auth is resolving', () => {
    useAuth.mockReturnValue({ loading: true, session: undefined, profile: null })
    render(
      <MemoryRouter>
        <ProtectedRoute><div>protected</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects to /login when unauthenticated', () => {
    useAuth.mockReturnValue({ loading: false, session: null, profile: null })
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute><div>protected</div></ProtectedRoute>} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('renders children when authenticated with matching role', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: { id: '1' } }, profile: { role: 'trainer' } })
    render(
      <MemoryRouter>
        <ProtectedRoute requiredRole="trainer"><div>trainer content</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('trainer content')).toBeInTheDocument()
  })

  it('redirects to / when authenticated but wrong role', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: { id: '1' } }, profile: { role: 'trainer' } })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><div>admin</div></ProtectedRoute>} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('home')).toBeInTheDocument()
  })

  it('renders children when authenticated with no role requirement', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: { id: '1' } }, profile: { role: 'trainer' } })
    render(
      <MemoryRouter>
        <ProtectedRoute><div>any authenticated content</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('any authenticated content')).toBeInTheDocument()
  })
})
