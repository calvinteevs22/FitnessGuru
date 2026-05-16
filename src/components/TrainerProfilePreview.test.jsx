// src/components/TrainerProfilePreview.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TrainerProfilePreview from './TrainerProfilePreview'

describe('TrainerProfilePreview', () => {
  it('renders "Client preview" label', () => {
    render(<TrainerProfilePreview profile={{}} />)
    expect(screen.getByText('Client preview')).toBeInTheDocument()
  })

  it('renders name when provided', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: [], locations: [] }} />)
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument()
  })

  it('renders two-letter initials from name when no photo', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: [], locations: [] }} />)
    expect(screen.getByText('JL')).toBeInTheDocument()
  })

  it('renders single-letter initial for single-word name', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan', specialties: [], locations: [] }} />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders specialties as pills', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: ['Strength', 'HIIT'], locations: [] }} />)
    expect(screen.getByText('Strength')).toBeInTheDocument()
    expect(screen.getByText('HIIT')).toBeInTheDocument()
  })

  it('renders hourly rate in footer', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: [], locations: [], hourlyRate: '85' }} />)
    expect(screen.getByText('$85/hr')).toBeInTheDocument()
  })

  it('renders locations in footer (max 2, then +N)', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: [], locations: ['Orchard', 'Novena', 'CBD'] }} />)
    expect(screen.getByText(/Orchard.*Novena.*\+1/)).toBeInTheDocument()
  })

  it('renders singular "yr experience" for yearsExp=1', () => {
    render(<TrainerProfilePreview profile={{ name: 'J', specialties: [], locations: [], yearsExp: '1' }} />)
    expect(screen.getByText('1 yr experience')).toBeInTheDocument()
  })

  it('renders plural "yrs experience" for yearsExp=3', () => {
    render(<TrainerProfilePreview profile={{ name: 'J', specialties: [], locations: [], yearsExp: '3' }} />)
    expect(screen.getByText('3 yrs experience')).toBeInTheDocument()
  })

  it('renders bio text', () => {
    render(<TrainerProfilePreview profile={{ name: 'J', specialties: [], locations: [], bio: 'Great trainer.' }} />)
    expect(screen.getByText('Great trainer.')).toBeInTheDocument()
  })
})
