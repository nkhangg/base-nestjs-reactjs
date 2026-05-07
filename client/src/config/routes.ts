export const ROUTES = {
  HOME: '/',
  PRICING: '/pricing',
  BLOG: '/blog',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',

  // Onboarding
  ONBOARDING: '/onboarding',

  // App (protected)
  DASHBOARD: '/dashboard',
  PROGRESS: '/progress',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  BILLING: '/billing',

  // Learning (protected, full-screen)
  FLASHCARDS: '/flashcards',
  GRAMMAR: '/grammar',
  MOCK_TEST: '/mock-test',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export const blogPostPath = (slug: string) => `/blog/${slug}`
