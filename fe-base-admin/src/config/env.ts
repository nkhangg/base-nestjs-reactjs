const requireEnv = (key: string): string => {
  const value = import.meta.env[key]
  if (!value) throw new Error(`Missing required env variable: ${key}`)
  return value
}

export const ENV = {
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'MyApp',
  APP_VERSION: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,

  API_BASE_URL: requireEnv('VITE_API_BASE_URL'),
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT ?? 10000),

  TOKEN_KEY: import.meta.env.VITE_TOKEN_KEY ?? 'access_token',
  REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY ?? 'refresh_token',
} as const
