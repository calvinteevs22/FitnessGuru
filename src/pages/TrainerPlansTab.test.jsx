// src/pages/TrainerPlansTab.test.jsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          in: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 't-1' }, error: null })) })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    })),
  },
}))

vi.mock('../components/ExerciseSearch', () => ({
  default: ({ onSelect }) => <button onClick={() => onSelect({ id: 'ex-1', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell' })}>Mock Search</button>,
}))

import TrainerPlansTab from './TrainerPlansTab'

describe('TrainerPlansTab', () => {
  it('renders Templates and Clients switcher', () => {
    render(<TrainerPlansTab trainerId="trainer-1" />)
    expect(screen.getByText('Templates')).toBeTruthy()
    expect(screen.getByText('Clients')).toBeTruthy()
  })

  it('shows New Template button in Templates view', () => {
    render(<TrainerPlansTab trainerId="trainer-1" />)
    expect(screen.getByText(/new template/i)).toBeTruthy()
  })
})
