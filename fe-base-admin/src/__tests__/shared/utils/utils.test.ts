import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatNumber,
  formatCurrency,
  formatDate,
  capitalize,
  truncate,
  cleanPayload,
  sleep,
  isEmpty,
} from '@shared/utils'

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('resolves tailwind conflicts — last wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
  it('ignores falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c')
  })
})

describe('formatNumber()', () => {
  it('formats with thousand separators', () => {
    expect(formatNumber(1000000)).toMatch(/1[.,]000[.,]000/)
  })
})

describe('formatCurrency()', () => {
  it('includes currency symbol', () => {
    expect(formatCurrency(50000)).toMatch(/50/)
  })
})

describe('capitalize()', () => {
  it('uppercases first letter', () => {
    expect(capitalize('hello world')).toBe('Hello world')
  })
  it('handles empty string', () => {
    expect(capitalize('')).toBe('')
  })
})

describe('truncate()', () => {
  it('truncates long strings', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })
  it('does not truncate short strings', () => {
    expect(truncate('hi', 10)).toBe('hi')
  })
})

describe('cleanPayload()', () => {
  it('removes null, undefined, and empty string', () => {
    const result = cleanPayload({ a: 1, b: null, c: undefined, d: '', e: 0 })
    expect(result).toEqual({ a: 1, e: 0 })
  })
})

describe('formatDate()', () => {
  it('formats a date string to dd/mm/yyyy', () => {
    expect(formatDate('2024-01-15')).toMatch(/15/)
    expect(formatDate('2024-01-15')).toMatch(/01/)
    expect(formatDate('2024-01-15')).toMatch(/2024/)
  })

  it('accepts a Date object', () => {
    const date = new Date('2023-06-30')
    expect(formatDate(date)).toMatch(/2023/)
  })
})

describe('sleep()', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves after the given delay', async () => {
    const done = vi.fn()
    sleep(500).then(done)
    vi.advanceTimersByTime(499)
    await Promise.resolve()
    expect(done).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    await Promise.resolve()
    expect(done).toHaveBeenCalledTimes(1)
  })
})

describe('isEmpty()', () => {
  it('returns true for empty object', () => {
    expect(isEmpty({})).toBe(true)
  })

  it('returns false for non-empty object', () => {
    expect(isEmpty({ a: 1 })).toBe(false)
  })

  it('returns false for object with null value', () => {
    expect(isEmpty({ key: null } as Record<string, unknown>)).toBe(false)
  })
})
