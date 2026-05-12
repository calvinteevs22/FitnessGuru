import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MultiSelect from './MultiSelect'

describe('MultiSelect', () => {
  it('renders all options as pills', () => {
    render(<MultiSelect options={['Strength', 'HIIT', 'Yoga']} selected={[]} onChange={() => {}} />)
    expect(screen.getByText('Strength')).toBeInTheDocument()
    expect(screen.getByText('HIIT')).toBeInTheDocument()
    expect(screen.getByText('Yoga')).toBeInTheDocument()
  })

  it('calls onChange with option added when unselected pill clicked', () => {
    const onChange = vi.fn()
    render(<MultiSelect options={['Strength', 'HIIT']} selected={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('Strength'))
    expect(onChange).toHaveBeenCalledWith(['Strength'])
  })

  it('calls onChange with option removed when selected pill clicked', () => {
    const onChange = vi.fn()
    render(<MultiSelect options={['Strength', 'HIIT']} selected={['Strength']} onChange={onChange} />)
    fireEvent.click(screen.getByText('Strength'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('adds custom entry on Enter key', () => {
    const onChange = vi.fn()
    render(<MultiSelect options={[]} selected={[]} onChange={onChange} allowCustom />)
    const input = screen.getByPlaceholderText('Add custom...')
    fireEvent.change(input, { target: { value: 'Pilates' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(['Pilates'])
  })

  it('does not add duplicate custom entry', () => {
    const onChange = vi.fn()
    render(<MultiSelect options={[]} selected={['Pilates']} onChange={onChange} allowCustom />)
    const input = screen.getByPlaceholderText('Add custom...')
    fireEvent.change(input, { target: { value: 'Pilates' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
