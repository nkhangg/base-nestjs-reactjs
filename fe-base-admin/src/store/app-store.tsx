import { createContext, useContext, useReducer, type ReactNode } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
export interface AppState {
  theme: 'light' | 'dark'
  locale: 'vi' | 'en'
  isInitialized: boolean
}

export type AppAction =
  | { type: 'SET_THEME'; payload: AppState['theme'] }
  | { type: 'SET_LOCALE'; payload: AppState['locale'] }
  | { type: 'SET_INITIALIZED' }

// ── Reducer ────────────────────────────────────────────────────────────────
const initialState: AppState = {
  theme: 'light',
  locale: 'vi',
  isInitialized: false,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_LOCALE':
      return { ...state, locale: action.payload }
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: true }
    default:
      return state
  }
}

// ── Context ────────────────────────────────────────────────────────────────
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
