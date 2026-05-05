import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';

@ApiTags('Health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Kiểm tra trạng thái service và kết nối DB + Redis',
  })
  @ApiResponse({ status: 200, description: 'Service healthy' })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  check() {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
      ...(this.redisIndicator.configured
        ? [() => this.redisIndicator.isHealthy('redis')]
        : []),
    ]);
  }
}
