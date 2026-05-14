import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import SignupEntryPage from './SignupEntryPage'

function renderPage() {
  return render(<MemoryRouter><SignupEntryPage /></MemoryRouter>)
}

describe('SignupEntryPage', () => {
  it('renders client card with correct link', () => {
    renderPage()
    expect(screen.getByText("I'm looking for a trainer")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/signup/client')
  })

  it('renders trainer card with correct link', () => {
    renderPage()
    expect(screen.getByText("I'm a trainer")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /apply as trainer/i })).toHaveAttribute('href', '/signup/trainer')
  })

  it('renders log in link', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
  })
})
