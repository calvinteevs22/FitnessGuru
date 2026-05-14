import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}))

import TrainerListingPage from './TrainerListingPage'

describe('TrainerListingPage', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><TrainerListingPage /></MemoryRouter>)
    expect(document.body).toBeTruthy()
  })

  it('shows a loading state initially', () => {
    render(<MemoryRouter><TrainerListingPage /></MemoryRouter>)
    expect(screen.getByText(/loading/i)).toBeTruthy()
  })
})
