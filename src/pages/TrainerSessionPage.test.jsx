// src/pages/TrainerSessionPage.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it } from 'vitest'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { user: { id: 'trainer-1' } },
    profile: { role: 'trainer', full_name: 'Trainer One' },
  }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: table === 'bookings'
              ? { id: 'booking-1', client_id: 'client-1', client_name: 'Jane Doe', trainer_id: 'trainer-1', scheduled_at: new Date().toISOString() }
              : table === 'client_plans'
              ? { id: 'plan-1', name: '4-Week Plan', client_plan_days: [{ id: 'day-1', day_number: 1, label: 'Day 1 – Push', is_rest: false, client_plan_exercises: [] }] }
              : null,
            error: null,
          })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'metric-1' }, error: null })) })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    })),
  },
}))

import TrainerSessionPage from './TrainerSessionPage'

describe('TrainerSessionPage', () => {
  it('renders the client name after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/trainer/session/booking-1']}>
        <Routes>
          <Route path="/trainer/session/:bookingId" element={<TrainerSessionPage />} />
        </Routes>
      </MemoryRouter>
    )
    await screen.findByText(/jane doe/i)
  })

  it('shows body metrics form', async () => {
    render(
      <MemoryRouter initialEntries={['/trainer/session/booking-1']}>
        <Routes>
          <Route path="/trainer/session/:bookingId" element={<TrainerSessionPage />} />
        </Routes>
      </MemoryRouter>
    )
    await screen.findByText(/body weight/i)
  })
})
