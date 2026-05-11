export { ROUTES } from '@config/routes'

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Nihongo Learning'

export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'] as const,
    SESSION: ['auth', 'session'] as const,
  },
  DASHBOARD: {
    STATS: ['dashboard', 'stats'] as const,
    MODULES: ['dashboard', 'modules'] as const,
  },
  FLASHCARD: {
    SESSION: ['flashcard', 'session'] as const,
    HISTORY: ['flashcard', 'history'] as const,
  },
  GRAMMAR: {
    LESSONS: ['grammar', 'lessons'] as const,
    LESSON: ['grammar', 'lesson'] as const,
  },
  MOCK_TEST: {
    LIST: ['mock-test', 'list'] as const,
    DETAIL: ['mock-test', 'detail'] as const,
  },
  PROGRESS: {
    MY: ['progress', 'my'] as const,
    STATS: ['progress', 'stats'] as const,
  },
  PROFILE: {
    ME: ['profile', 'me'] as const,
  },
  BLOG: {
    POSTS: ['blog', 'posts'] as const,
    POST: ['blog', 'post'] as const,
  },
  BILLING: {
    PLANS: ['billing', 'plans'] as const,
    SUBSCRIPTION: ['billing', 'subscription'] as const,
    USAGE: ['billing', 'usage'] as const,
    PAYMENT_METHODS: ['billing', 'payment-methods'] as const,
    INVOICES: ['billing', 'invoices'] as const,
  },
  NOTIFICATIONS: {
    LIST: ['notifications', 'list'] as const,
    UNREAD_COUNT: ['notifications', 'unread-count'] as const,
  },
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
