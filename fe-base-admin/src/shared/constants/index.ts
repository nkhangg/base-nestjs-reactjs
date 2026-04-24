export { ROUTES } from '@config/routes'

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'MyApp'

export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'] as const,
    SESSION: ['auth', 'session'] as const,
  },
  DASHBOARD: {
    STATS: ['dashboard', 'stats'] as const,
  },
  ADMIN: {
    USERS: ['admin', 'users'] as const,
  },
  CONFIGS: ['configs'] as const,
} as const

export const DATE_FORMAT = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_TIME: 'dd/MM/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const
