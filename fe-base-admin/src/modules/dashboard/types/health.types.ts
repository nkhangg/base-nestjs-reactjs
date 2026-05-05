export interface HealthIndicatorStatus {
  status: 'up' | 'down'
  [key: string]: unknown
}

export interface HealthCheckResponse {
  status: 'ok' | 'error'
  info?: Record<string, HealthIndicatorStatus>
  error?: Record<string, HealthIndicatorStatus>
  details?: Record<string, HealthIndicatorStatus>
}
