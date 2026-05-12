import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import FileUpload from './FileUpload'

describe('FileUpload', () => {
  it('renders the label', () => {
    render(<FileUpload label="Upload ID" onChange={() => {}} files={[]} />)
    expect(screen.getByText('Upload ID')).toBeInTheDocument()
  })

  it('calls onChange with valid file', () => {
    const onChange = vi.fn()
    render(<FileUpload label="Upload" onChange={onChange} files={[]} />)
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 1024 })
    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } })
    expect(onChange).toHaveBeenCalledWith([file])
  })

  it('does not call onChange with invalid file type', () => {
    const onChange = vi.fn()
    render(<FileUpload label="Upload" onChange={onChange} files={[]} />)
    const file = new File(['x'], 'test.exe', { type: 'application/octet-stream' })
    Object.defineProperty(file, 'size', { value: 100 })
    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText(/PDF, JPG, and PNG/)).toBeInTheDocument()
  })
})
