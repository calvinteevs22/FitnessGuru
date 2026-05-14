import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, beforeEach } from 'vitest'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'test@example.com' } },
    profile: null,
    loading: false,
  }),
}))
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    functions: { invoke: vi.fn() },
  },
}))

import ClientDashboardPage from './ClientDashboardPage'

describe('ClientDashboardPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    render(<MemoryRouter><ClientDashboardPage /></MemoryRouter>)
    expect(document.body).toBeTruthy()
  })

  it('shows a loading state initially', () => {
    render(<MemoryRouter><ClientDashboardPage /></MemoryRouter>)
    expect(screen.getByText(/loading/i)).toBeTruthy()
  })
})
