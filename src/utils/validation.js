export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export function validateFile(file) {
  if (!file) return 'A file is required.'
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Only PDF, JPG, and PNG files are accepted.'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File must be smaller than 5MB.'
  }
  return null
}

export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
  return null
}

export function validatePassword(password) {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  return null
}

export function validateRequired(value, fieldName) {
  const empty = value === null || value === undefined ||
    (typeof value === 'string' && !value.trim()) ||
    (Array.isArray(value) && value.length === 0)
  return empty ? `${fieldName} is required.` : null
}
