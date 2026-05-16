import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'user-123' } } }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import ApplicationStatusPage from './ApplicationStatusPage'

function mockStatus(status, opts = {}) {
  supabase.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            status,
            application_ref: 'RPT-00001',
            rejection_reason: opts.rejection_reason ?? null,
          },
          error: null,
        }),
      }),
    }),
  })
}

function renderPage() {
  return render(<MemoryRouter><ApplicationStatusPage /></MemoryRouter>)
}

describe('ApplicationStatusPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows pending message', async () => {
    mockStatus('pending')
    renderPage()
    expect(await screen.findByText(/Under review/)).toBeInTheDocument()
  })

  it('shows docs_verified message', async () => {
    mockStatus('docs_verified')
    renderPage()
    expect(await screen.findByText(/Documents verified/)).toBeInTheDocument()
  })

  it('shows approved message with availability CTA', async () => {
    mockStatus('approved')
    renderPage()
    expect(await screen.findByText(/Approved/)).toBeInTheDocument()
    expect(screen.getByText(/Set your first available slots/)).toBeInTheDocument()
  })

  it('shows rejection reason when rejected', async () => {
    mockStatus('rejected', { rejection_reason: 'ID document was blurry' })
    renderPage()
    expect(await screen.findByText('ID document was blurry')).toBeInTheDocument()
  })

  it('shows application ref number', async () => {
    mockStatus('pending')
    renderPage()
    expect(await screen.findByText(/RPT-00001/)).toBeInTheDocument()
  })

  it('redirects to dashboard when status is live', async () => {
    mockStatus('live')
    renderPage()
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/trainer', { replace: true })
    })
  })
})
