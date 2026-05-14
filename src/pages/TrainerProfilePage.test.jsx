import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, beforeEach } from 'vitest'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ session: null, profile: null, loading: false }),
}))

vi.mock('../lib/supabase', () => {
  const terminal = {
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }
  const eqChain = {
    eq: vi.fn(() => eqChain),
    single: terminal.single,
  }
  const selectChain = {
    select: vi.fn(() => eqChain),
    eq: vi.fn(() => eqChain),
  }
  return {
    supabase: {
      from: vi.fn(() => selectChain),
    },
  }
})

vi.mock('../utils/slotGenerator', () => ({
  generateSlots: vi.fn(() => []),
  formatSlotSGT: vi.fn(iso => iso),
  formatDateHeader: vi.fn(d => d),
}))

import TrainerProfilePage from './TrainerProfilePage'

function renderPage(id = 'test-id') {
  return render(
    <MemoryRouter initialEntries={[`/trainer/${id}`]}>
      <Routes>
        <Route path="/trainer/:id" element={<TrainerProfilePage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TrainerProfilePage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    renderPage()
    expect(document.body).toBeTruthy()
  })
})
