const _apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
if (!_apiBaseUrl) throw new Error('Missing required env variable: NEXT_PUBLIC_API_BASE_URL')

export const ENV = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'Nihongo Learning',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',

  API_BASE_URL: _apiBaseUrl,
  API_TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 10000),

  TOKEN_KEY: process.env.NEXT_PUBLIC_TOKEN_KEY ?? 'access_token',
  REFRESH_TOKEN_KEY: process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY ?? 'refresh_token',

  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
} as const
