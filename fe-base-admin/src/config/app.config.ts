import { ENV } from './env'

export const APP_CONFIG = {
  name: ENV.APP_NAME,
  version: ENV.APP_VERSION,

  // Feature flags — toggle without touching code
  features: {
    darkMode: true,
    i18n: true,
    devtools: ENV.IS_DEV,
  },

  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },
} as const
