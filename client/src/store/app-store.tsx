'use client'

import { createContext, useContext, useReducer, type ReactNode } from 'react'

export interface AppState {
  locale: 'vi' | 'en'
  isInitialized: boolean
}

export type AppAction =
  | { type: 'SET_LOCALE'; payload: AppState['locale'] }
  | { type: 'SET_INITIALIZED' }

const initialState: AppState = {
  locale: 'vi',
  isInitialized: false,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOCALE':
      return { ...state, locale: action.payload }
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: true }
    default:
      return state
  }
}

const AppStoreContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return (
    <AppStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStoreContext.Provider>
  )
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
