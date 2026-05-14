// src/components/ExerciseSearch.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, beforeEach, expect } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [
              { id: 'ex-1', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell' }
            ], error: null })),
          })),
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}))

import ExerciseSearch from './ExerciseSearch'

describe('ExerciseSearch', () => {
  it('renders search input', () => {
    render(<ExerciseSearch onSelect={vi.fn()} />)
    expect(screen.getByPlaceholderText(/search exercises/i)).toBeTruthy()
  })

  it('calls onSelect when an exercise is clicked', async () => {
    const onSelect = vi.fn()
    render(<ExerciseSearch onSelect={onSelect} />)
    const input = screen.getByPlaceholderText(/search exercises/i)
    fireEvent.change(input, { target: { value: 'bench' } })
    await waitFor(() => screen.getByText('Bench Press'))
    fireEvent.mouseDown(screen.getByText('Bench Press'))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Bench Press' })
    )
  })
})
