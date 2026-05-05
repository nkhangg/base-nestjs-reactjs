import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@shared/hooks'

describe('useDebounce()', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('does not update before delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    })
    rerender({ value: 'updated' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('initial')
  })

  it('updates after delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    })
    rerender({ value: 'updated' })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('updated')
  })

  it('resets timer on rapid changes — only last value is applied', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })
    rerender({ value: 'b' })
    act(() => vi.advanceTimersByTime(100))
    rerender({ value: 'c' })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('c')
  })

  it('uses default delay of 300ms', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'x' },
    })
    rerender({ value: 'y' })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('x')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('y')
  })

  it('works with numeric values', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 0 },
    })
    rerender({ value: 42 })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe(42)
  })
})
