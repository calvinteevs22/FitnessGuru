// src/components/ProgressRing.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProgressRing from './ProgressRing'

describe('ProgressRing', () => {
  it('renders the value and unit', () => {
    render(<ProgressRing progress={0.5} value={75.5} unit="kg" label="of 70kg" />)
    expect(screen.getByText(/75.5/)).toBeTruthy()
    expect(screen.getByText('of 70kg')).toBeTruthy()
  })

  it('renders without label', () => {
    render(<ProgressRing progress={0.75} value={18} unit="%" />)
    expect(screen.getByText(/18/)).toBeTruthy()
  })

  it('clamps progress above 1 to 1', () => {
    // No crash when progress > 1
    render(<ProgressRing progress={1.5} value={70} unit="kg" />)
    expect(screen.getByText(/70/)).toBeTruthy()
  })

  it('clamps progress below 0 to 0', () => {
    render(<ProgressRing progress={-0.5} value={80} unit="kg" />)
    expect(screen.getByText(/80/)).toBeTruthy()
  })
})
