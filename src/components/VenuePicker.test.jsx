import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import VenuePicker from './VenuePicker'

describe('VenuePicker', () => {
  it('renders all 6 venue type pills', () => {
    render(<VenuePicker value={{ type: null, name: '' }} onChange={() => {}} />)
    expect(screen.getByText('Condo Gym')).toBeInTheDocument()
    expect(screen.getByText('ActiveSG Gym')).toBeInTheDocument()
    expect(screen.getByText('Commercial Gym')).toBeInTheDocument()
    expect(screen.getByText('Outdoor')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('calls onChange with type and empty name when pill clicked', () => {
    const onChange = vi.fn()
    render(<VenuePicker value={{ type: null, name: '' }} onChange={onChange} />)
    fireEvent.click(screen.getByText('Condo Gym'))
    expect(onChange).toHaveBeenCalledWith({ type: 'condo_gym', name: '' })
  })

  it('shows text input for condo_gym', () => {
    render(<VenuePicker value={{ type: 'condo_gym', name: '' }} onChange={() => {}} />)
    const input = screen.getByPlaceholderText(/Interlace/i)
    expect(input).toBeInTheDocument()
  })

  it('shows region dropdown for activesg', () => {
    render(<VenuePicker value={{ type: 'activesg', name: '' }} onChange={() => {}} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Central')).toBeInTheDocument()
  })

  it('shows gym dropdown after region selected', () => {
    render(<VenuePicker value={{ type: 'activesg', name: '' }} onChange={() => {}} />)
    const regionSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(regionSelect, { target: { value: 'East' } })
    expect(screen.getByText('ActiveSG Gym @ Bedok Sports Centre')).toBeInTheDocument()
  })

  it('no secondary input when type is null', () => {
    render(<VenuePicker value={{ type: null, name: '' }} onChange={() => {}} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('calls onChange on text input change', () => {
    const onChange = vi.fn()
    render(<VenuePicker value={{ type: 'outdoor', name: '' }} onChange={onChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'East Coast Park' } })
    expect(onChange).toHaveBeenCalledWith({ type: 'outdoor', name: 'East Coast Park' })
  })
})
