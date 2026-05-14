import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it } from 'vitest'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { email: 'test@example.com' } }, profile: null, loading: false }),
}))
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}))

import BookingConfirmedPage from './BookingConfirmedPage'

describe('BookingConfirmedPage', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><BookingConfirmedPage /></MemoryRouter>)
    expect(document.body).toBeTruthy()
  })
})
