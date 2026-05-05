import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDisclosure } from '@shared/hooks'

describe('useDisclosure()', () => {
  it('defaults to closed', () => {
    const { result } = renderHook(() => useDisclosure())
    expect(result.current.isOpen).toBe(false)
  })

  it('accepts defaultOpen=true', () => {
    const { result } = renderHook(() => useDisclosure(true))
    expect(result.current.isOpen).toBe(true)
  })

  it('open() sets isOpen to true', () => {
    const { result } = renderHook(() => useDisclosure())
    act(() => result.current.open())
    expect(result.current.isOpen).toBe(true)
  })

  it('close() sets isOpen to false', () => {
    const { result } = renderHook(() => useDisclosure(true))
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })

  it('toggle() flips state', () => {
    const { result } = renderHook(() => useDisclosure())
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(true)
    act(() => result.current.toggle())
    expect(result.current.isOpen).toBe(false)
  })

  it('open() is idempotent', () => {
    const { result } = renderHook(() => useDisclosure(true))
    act(() => result.current.open())
    expect(result.current.isOpen).toBe(true)
  })

  it('close() is idempotent', () => {
    const { result } = renderHook(() => useDisclosure(false))
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })
})
