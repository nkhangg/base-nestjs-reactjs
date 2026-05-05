import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1_000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
