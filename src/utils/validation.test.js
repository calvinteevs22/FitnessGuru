import { describe, it, expect } from 'vitest'
import {
  validateFile,
  validateEmail,
  validatePassword,
  validateRequired,
  MAX_FILE_SIZE_BYTES,
} from './validation'

describe('validateFile', () => {
  it('accepts PDF files under 5MB', () => {
    const file = { type: 'application/pdf', size: 1024 * 1024 }
    expect(validateFile(file)).toBeNull()
  })
  it('accepts JPEG files', () => {
    expect(validateFile({ type: 'image/jpeg', size: 100 })).toBeNull()
  })
  it('accepts PNG files', () => {
    expect(validateFile({ type: 'image/png', size: 100 })).toBeNull()
  })
  it('rejects disallowed file types', () => {
    expect(validateFile({ type: 'text/plain', size: 100 })).toMatch(/PDF, JPG, and PNG/)
  })
  it('rejects files over 5MB', () => {
    expect(validateFile({ type: 'image/jpeg', size: MAX_FILE_SIZE_BYTES + 1 })).toMatch(/5MB/)
  })
})

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull()
  })
  it('rejects empty email', () => {
    expect(validateEmail('')).toMatch(/required|valid/i)
  })
  it('rejects email without @', () => {
    expect(validateEmail('notanemail')).toMatch(/valid email/i)
  })
})

describe('validatePassword', () => {
  it('accepts 8+ character password', () => {
    expect(validatePassword('securepass')).toBeNull()
  })
  it('rejects password shorter than 8 characters', () => {
    expect(validatePassword('short')).toMatch(/8 characters/i)
  })
  it('rejects empty password', () => {
    expect(validatePassword('')).toMatch(/required|password/i)
  })
})

describe('validateRequired', () => {
  it('accepts non-empty string', () => {
    expect(validateRequired('hello', 'Name')).toBeNull()
  })
  it('rejects empty string', () => {
    expect(validateRequired('', 'Name')).toMatch(/Name/)
  })
  it('rejects empty array', () => {
    expect(validateRequired([], 'Specialties')).toMatch(/Specialties/)
  })
  it('accepts non-empty array', () => {
    expect(validateRequired(['yoga'], 'Specialties')).toBeNull()
  })
})
