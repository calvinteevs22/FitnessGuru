// src/components/ProgressCharts.test.jsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it } from 'vitest'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: table === 'client_body_metrics'
              ? [{ measured_at: '2026-01-01T00:00:00Z', weight_kg: 72.5, body_fat_pct: 18.0 },
                 { measured_at: '2026-01-08T00:00:00Z', weight_kg: 71.5, body_fat_pct: 17.5 }]
              : [],
            error: null,
          })),
        })),
      })),
    })),
  },
}))

import ProgressCharts from './ProgressCharts'

describe('ProgressCharts', () => {
  it('renders Body and Strength tabs', () => {
    render(<ProgressCharts clientId="client-1" />)
    expect(screen.getByText('Body')).toBeTruthy()
    expect(screen.getByText('Strength')).toBeTruthy()
  })

  it('renders a chart when body data loads', async () => {
    render(<ProgressCharts clientId="client-1" />)
    await screen.findByTestId('line-chart')
  })
})
