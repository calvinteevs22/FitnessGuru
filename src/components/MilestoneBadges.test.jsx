// src/components/MilestoneBadges.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MilestoneBadges from './MilestoneBadges'

describe('MilestoneBadges', () => {
  it('shows all 5 badge labels', () => {
    render(<MilestoneBadges maxProgress={0} hasMetrics={false} />)
    expect(screen.getByText('First weigh-in logged')).toBeTruthy()
    expect(screen.getByText('Quarter of the way')).toBeTruthy()
    expect(screen.getByText('Halfway there')).toBeTruthy()
    expect(screen.getByText('75% to goal')).toBeTruthy()
    expect(screen.getByText('Goal reached!')).toBeTruthy()
  })

  it('first badge earned when hasMetrics is true', () => {
    render(<MilestoneBadges maxProgress={0} hasMetrics={true} />)
    const firstBadge = screen.getByText('First weigh-in logged').closest('div')
    expect(firstBadge.style.opacity).toBe('1')
  })

  it('first badge unearned when hasMetrics is false', () => {
    render(<MilestoneBadges maxProgress={0} hasMetrics={false} />)
    const firstBadge = screen.getByText('First weigh-in logged').closest('div')
    expect(firstBadge.style.opacity).toBe('0.45')
  })

  it('halfway badge earned at 0.5 progress', () => {
    render(<MilestoneBadges maxProgress={0.5} hasMetrics={true} />)
    const halfBadge = screen.getByText('Halfway there').closest('div')
    expect(halfBadge.style.opacity).toBe('1')
  })

  it('quarter badge not earned at 0.24 progress', () => {
    render(<MilestoneBadges maxProgress={0.24} hasMetrics={true} />)
    const quarterBadge = screen.getByText('Quarter of the way').closest('div')
    expect(quarterBadge.style.opacity).toBe('0.45')
  })

  it('all badges earned at 1.0 progress', () => {
    render(<MilestoneBadges maxProgress={1.0} hasMetrics={true} />)
    const goalBadge = screen.getByText('Goal reached!').closest('div')
    expect(goalBadge.style.opacity).toBe('1')
  })
})
