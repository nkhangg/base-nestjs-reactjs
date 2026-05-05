import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup sau mỗi test
afterEach(() => {
  cleanup()
})

// Mock localStorage — Proxy-based so Object.keys(localStorage) returns stored keys,
// which is required for storage.clear() prefix-filtering to work.
const localStorageMock = (() => {
  const store: Record<string, string> = {}
  const methods = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
  return new Proxy(methods, {
    ownKeys: () => Object.keys(store),
    getOwnPropertyDescriptor: (_target, key) => {
      if (typeof key === 'string' && key in store) {
        return { enumerable: true, configurable: true, writable: true, value: store[key] }
      }
      return undefined
    },
    has: (target, key) => key in store || key in target,
    get: (target, key) =>
      key in store ? store[key as string] : target[key as keyof typeof methods],
  })
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
