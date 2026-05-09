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
  MEDIA: {
    FILES: ['media', 'files'] as const,
    FOLDERS: ['media', 'folders'] as const,
  },
  AUDIT_LOGS: ['audit-logs'] as const,
  NOTIFICATIONS: {
    LIST: ['notifications', 'list'] as const,
    UNREAD_COUNT: ['notifications', 'unread-count'] as const,
    SENT: ['notifications', 'sent'] as const,
  },
  BLOG: {
    POSTS: ['blog', 'posts'] as const,
    POST: ['blog', 'post'] as const,
    CATEGORIES: ['blog', 'categories'] as const,
  },
  DICTIONARY: {
    LIST: ['dictionary', 'list'] as const,
    PENDING: ['dictionary', 'pending'] as const,
    ENTRY: ['dictionary', 'entry'] as const,
  },
  ARTICLE: {
    LIST: ['article', 'list'] as const,
    PENDING: ['article', 'pending'] as const,
    DETAIL: ['article', 'detail'] as const,
    CATEGORIES: ['article', 'categories'] as const,
    TAGS: ['article', 'tags'] as const,
  },
  QUESTION: {
    LIST: ['question', 'list'] as const,
    ENTRY: ['question', 'entry'] as const,
  },
  PROGRESS: {
    USER_ACTIVITY: ['progress', 'user-activity'] as const,
    LEADERBOARD: ['progress', 'leaderboard'] as const,
  },
  ORGANIZATION: {
    LIST: ['organization', 'list'] as const,
    DETAIL: ['organization', 'detail'] as const,
    CLASSROOMS: ['organization', 'classrooms'] as const,
    MEMBERS: ['organization', 'members'] as const,
    REPORT: ['organization', 'report'] as const,
  },
  CONTACTS: {
    LIST: ['contacts', 'list'] as const,
    DETAIL: ['contacts', 'detail'] as const,
  },
  HEALTH: ['health'] as const,
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
