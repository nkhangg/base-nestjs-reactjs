export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  ROLES: '/admin/roles',
  USERS: '/users',
  CONFIGS: '/configs',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
