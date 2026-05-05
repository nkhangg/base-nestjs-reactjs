import { Injectable, Optional, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../authorization/authorization.module';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {
    super();
  }

  get configured(): boolean {
    return this.redis !== null;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redis!.ping();
      return this.getStatus(key, true);
    } catch (error) {
      const result = this.getStatus(key, false, { message: (error as Error).message });
      throw new HealthCheckError('Redis check failed', result);
    }
  }
}
