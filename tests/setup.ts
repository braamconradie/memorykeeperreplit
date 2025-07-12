import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:5000',
    origin: 'http://localhost:5000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})

// Mock fetch globally
global.fetch = vi.fn()

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))