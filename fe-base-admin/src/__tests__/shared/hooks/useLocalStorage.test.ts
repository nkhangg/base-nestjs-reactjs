import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@shared/hooks'

beforeEach(() => localStorage.clear())

describe('useLocalStorage()', () => {
  it('returns initial value when key is not in storage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('reads existing value from localStorage on mount', () => {
    localStorage.setItem('app_existing', JSON.stringify('persisted'))
    const { result } = renderHook(() => useLocalStorage('existing', 'fallback'))
    expect(result.current[0]).toBe('persisted')
  })

  it('setValue updates state and persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('key', 0))
    act(() => result.current[1](42))
    expect(result.current[0]).toBe(42)
    expect(JSON.parse(localStorage.getItem('app_key')!)).toBe(42)
  })

  it('setValue accepts a function updater', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 10))
    act(() => result.current[1]((prev) => prev + 5))
    expect(result.current[0]).toBe(15)
  })

  it('removeValue resets state to initial value', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'))
    act(() => result.current[1]('changed'))
    act(() => result.current[2]())
    expect(result.current[0]).toBe('initial')
  })

  it('removeValue clears the key from localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'v'))
    act(() => result.current[1]('stored'))
    act(() => result.current[2]())
    expect(localStorage.getItem('app_key')).toBeNull()
  })

  it('works with object values', () => {
    const initial = { name: 'Alice', age: 30 }
    const { result } = renderHook(() => useLocalStorage('user', initial))
    act(() => result.current[1]({ name: 'Bob', age: 25 }))
    expect(result.current[0]).toEqual({ name: 'Bob', age: 25 })
  })
})
