import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ClientSignupPage from './ClientSignupPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}))
import { supabase } from '../lib/supabase'

function renderPage() {
  return render(<MemoryRouter><ClientSignupPage /></MemoryRouter>)
}

describe('ClientSignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Step 1 of 3 progress indicator', () => {
    renderPage()
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
  })

  it('renders email, password, and confirm password fields', () => {
    renderPage()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Different1!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    })
  })

  it('calls supabase.auth.signUp and navigates on success', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null })
    renderPage()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password1!',
        options: { emailRedirectTo: expect.stringContaining('/signup/client/profile') },
      })
      expect(mockNavigate).toHaveBeenCalledWith('/signup/client/profile')
    })
  })

  it('shows server error on signUp failure', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: { message: 'User already registered' } })
    renderPage()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument()
    })
  })

  it('renders log in link pointing to /login?role=client', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /log in/i })
    expect(link).toHaveAttribute('href', '/login?role=client')
  })
})
