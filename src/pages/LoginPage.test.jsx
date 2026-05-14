import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LoginPage from './LoginPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })) })),
  },
}))
import { supabase } from '../lib/supabase'

function renderWithRole(role = '') {
  const path = role ? `/login?role=${role}` : '/login'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('defaults to client tab when no role param', () => {
    renderWithRole()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create one free/i })).toHaveAttribute('href', '/signup/client')
  })

  it('activates trainer tab when ?role=trainer', () => {
    renderWithRole('trainer')
    expect(screen.getByText('Trainer sign in')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /apply as a trainer/i })).toHaveAttribute('href', '/signup/trainer')
  })

  it('switches tab on click', () => {
    renderWithRole()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /trainer/i }))
    expect(screen.getByText('Trainer sign in')).toBeInTheDocument()
  })

  it('redirects to /dashboard/trainer after trainer login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'uid' } }, error: null })
    supabase.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'trainer' } }) }) }),
    })
    renderWithRole('trainer')
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'trainer@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/trainer')
    })
  })

  it('redirects to / after client login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'uid' } }, error: null })
    supabase.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'client' } }) }) }),
    })
    renderWithRole('client')
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'client@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
