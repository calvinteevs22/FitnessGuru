// src/pages/ClientPlanTab.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'client_plans') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: {
                    id: 'plan-1',
                    name: '4-Week Strength',
                    goal: 'Build muscle',
                    total_weeks: 4,
                    client_plan_days: [
                      {
                        id: 'day-1',
                        day_number: 1,
                        label: 'Day 1 – Push',
                        is_rest: false,
                        client_plan_exercises: [
                          {
                            id: 'ex-1',
                            sets: 3,
                            reps: 10,
                            weight_kg: 60,
                            notes: 'Keep elbows tucked',
                            exercises: { name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell' },
                          },
                        ],
                      },
                    ],
                  },
                  error: null,
                })),
              })),
            })),
          })),
        }
      }
      if (table === 'client_sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        }
      }
      return { select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: [], error: null })) })) }
    }),
  },
}))

import ClientPlanTab from './ClientPlanTab'

describe('ClientPlanTab', () => {
  it('renders plan name when data loads', async () => {
    render(<ClientPlanTab clientId="client-1" />)
    await screen.findByText('4-Week Strength')
  })

  it('expands day to show exercises on click', async () => {
    render(<ClientPlanTab clientId="client-1" />)
    const dayBtn = await screen.findByText('Day 1 – Push')
    fireEvent.click(dayBtn)
    await screen.findByText('Bench Press')
  })
})
