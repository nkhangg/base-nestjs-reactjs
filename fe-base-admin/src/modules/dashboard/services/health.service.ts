import { apiClient } from '@lib/api-client/instance'
import type { HealthCheckResponse } from '../types/health.types'

export const healthService = {
  check: () =>
    apiClient.get<HealthCheckResponse>('/health', {
      // Accept 503 as a valid response (unhealthy but reachable)
      validateStatus: (status) => status < 600,
    }),
}
