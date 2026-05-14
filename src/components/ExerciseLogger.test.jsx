// src/components/ExerciseLogger.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it } from 'vitest'

const mockDay = {
  id: 'day-1',
  label: 'Day 1 – Push',
  is_rest: false,
  client_plan_exercises: [
    {
      id: 'cpe-1',
      sets: 3,
      reps: 10,
      weight_kg: 60,
      notes: 'Keep elbows tucked',
      exercises: { id: 'ex-1', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
    },
  ],
}

import ExerciseLogger from './ExerciseLogger'

describe('ExerciseLogger', () => {
  it('renders exercise name', () => {
    render(<ExerciseLogger day={mockDay} logs={{}} onLogSet={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.getByText('Bench Press')).toBeTruthy()
  })

  it('shows target sets and reps', () => {
    render(<ExerciseLogger day={mockDay} logs={{}} onLogSet={vi.fn()} onFinish={vi.fn()} />)
    expect(screen.getByText(/3 × 10/)).toBeTruthy()
  })

  it('calls onLogSet when Log Set is clicked', () => {
    const onLogSet = vi.fn()
    render(<ExerciseLogger day={mockDay} logs={{}} onLogSet={onLogSet} onFinish={vi.fn()} />)
    const repsInput = screen.getAllByPlaceholderText(/reps/i)[0]
    fireEvent.change(repsInput, { target: { value: '10' } })
    fireEvent.click(screen.getByText(/log set/i))
    expect(onLogSet).toHaveBeenCalledWith('cpe-1', '10', '')
  })
})
