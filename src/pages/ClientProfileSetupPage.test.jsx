import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ClientProfileSetupPage from './ClientProfileSetupPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ session: { user: { id: 'user-123' } } })),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({ error: null })),
      insert: vi.fn(() => ({ error: null })),
    })),
  },
}))
import { supabase } from '../lib/supabase'

function renderPage() {
  return render(<MemoryRouter><ClientProfileSetupPage /></MemoryRouter>)
}

describe('ClientProfileSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders Step 2 of 3 on mount', () => {
    renderPage()
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
  })

  it('shows error when full name is empty on Step 2', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
    })
  })

  it('advances to Step 3 when full name is provided', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
    })
  })

  it('shows goal chips and region pills on Step 3', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(screen.getByText('Lose weight')).toBeInTheDocument()
      expect(screen.getByText('Central')).toBeInTheDocument()
    })
  })

  it('shows error on Step 3 when goal or region not selected', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => screen.getByText('Step 3 of 3'))
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))
    await waitFor(() => {
      expect(screen.getByText(/please select a goal and region/i)).toBeInTheDocument()
    })
  })

  it('saves to supabase, sets localStorage, and navigates to / on completion', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    supabase.from.mockImplementation((table) => {
      if (table === 'profiles') return { upsert: upsertMock }
      if (table === 'client_profiles') return { upsert: insertMock }
      return {}
    })

    renderPage()
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => screen.getByText('Step 3 of 3'))

    fireEvent.click(screen.getByText('Lose weight'))
    fireEvent.click(screen.getByText('East'))
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))

    await waitFor(() => {
      expect(localStorage.getItem('fg_goal')).toBe('Lose weight')
      expect(localStorage.getItem('fg_region')).toBe('East')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
