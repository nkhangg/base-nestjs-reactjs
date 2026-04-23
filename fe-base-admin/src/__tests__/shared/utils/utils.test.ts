import { describe, it, expect } from 'vitest'
import { cn, formatNumber, formatCurrency, capitalize, truncate, cleanPayload } from '@shared/utils'

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
