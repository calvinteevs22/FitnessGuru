import '@testing-library/jest-dom'

// Node.js v22+ exposes a native localStorage that lacks full Web Storage API
// compatibility. Replace it with a proper in-memory implementation for tests.
if (typeof localStorage === 'undefined' || typeof localStorage.clear !== 'function') {
  const makeStorage = () => {
    const store = {}
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v) },
      removeItem: (k) => { delete store[k] },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
      get length() { return Object.keys(store).length },
      key: (i) => Object.keys(store)[i] ?? null,
    }
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: makeStorage(),
    writable: true,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: makeStorage(),
    writable: true,
    configurable: true,
  })
}
