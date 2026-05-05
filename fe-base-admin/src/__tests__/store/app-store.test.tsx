import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AppStoreProvider, useAppStore } from '@store/app-store'

function TestConsumer() {
  const { state, dispatch } = useAppStore()
  return (
    <div>
      <span data-testid="theme">{state.theme}</span>
      <span data-testid="locale">{state.locale}</span>
      <span data-testid="initialized">{String(state.isInitialized)}</span>
      <button onClick={() => dispatch({ type: 'SET_THEME', payload: 'dark' })}>dark</button>
      <button onClick={() => dispatch({ type: 'SET_THEME', payload: 'light' })}>light</button>
      <button onClick={() => dispatch({ type: 'SET_LOCALE', payload: 'en' })}>en</button>
      <button onClick={() => dispatch({ type: 'SET_INITIALIZED' })}>init</button>
    </div>
  )
}

describe('AppStoreProvider + useAppStore', () => {
  it('provides default initial state', () => {
    render(
      <AppStoreProvider>
        <TestConsumer />
      </AppStoreProvider>,
    )
    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(screen.getByTestId('locale').textContent).toBe('vi')
    expect(screen.getByTestId('initialized').textContent).toBe('false')
  })

  it('SET_THEME updates theme', () => {
    render(
      <AppStoreProvider>
        <TestConsumer />
      </AppStoreProvider>,
    )
    act(() => screen.getByText('dark').click())
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('SET_THEME can switch back to light', () => {
    render(
      <AppStoreProvider>
        <TestConsumer />
      </AppStoreProvider>,
    )
    act(() => screen.getByText('dark').click())
    act(() => screen.getByText('light').click())
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('SET_LOCALE updates locale', () => {
    render(
      <AppStoreProvider>
        <TestConsumer />
      </AppStoreProvider>,
    )
    act(() => screen.getByText('en').click())
    expect(screen.getByTestId('locale').textContent).toBe('en')
  })

  it('SET_INITIALIZED sets isInitialized to true', () => {
    render(
      <AppStoreProvider>
        <TestConsumer />
      </AppStoreProvider>,
    )
    act(() => screen.getByText('init').click())
    expect(screen.getByTestId('initialized').textContent).toBe('true')
  })

  it('throws when useAppStore is used outside provider', () => {
    const original = console.error
    console.error = () => {}
    expect(() => render(<TestConsumer />)).toThrow(
      'useAppStore must be used within AppStoreProvider',
    )
    console.error = original
  })
})
