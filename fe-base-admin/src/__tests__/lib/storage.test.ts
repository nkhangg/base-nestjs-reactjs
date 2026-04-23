import { describe, it, expect, beforeEach } from 'vitest'
import { storage } from '@lib/storage'

beforeEach(() => localStorage.clear())

describe('storage', () => {
  it('sets and gets a value', () => {
    storage.set('token', 'abc123')
    expect(storage.get<string>('token')).toBe('abc123')
  })

  it('returns null for missing key', () => {
    expect(storage.get('nonexistent')).toBeNull()
  })

  it('removes a key', () => {
    storage.set('key', 'value')
    storage.remove('key')
    expect(storage.get('key')).toBeNull()
  })

  it('stores objects as JSON', () => {
    const obj = { id: 1, name: 'Test' }
    storage.set('user', obj)
    expect(storage.get('user')).toEqual(obj)
  })

  it('clears all prefixed keys', () => {
    storage.set('a', 1)
    storage.set('b', 2)
    storage.clear()
    expect(storage.get('a')).toBeNull()
    expect(storage.get('b')).toBeNull()
  })
})
