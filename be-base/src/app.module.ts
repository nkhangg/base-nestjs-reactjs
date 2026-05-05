import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AdminShellModule } from './core/admin-shell';
import { AuthModule } from './core/auth';
import { AuthorizationModule } from './core/authorization';
import { EventsModule } from './core/events';
import { HealthModule } from './core/health/health.module';
import { IntegrationModule } from './core/integration/integration.module';
import { AdminModule } from './modules/admin';
import { AuditModule } from './modules/audit';
import { UserModule } from './modules/user/user.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { ConfigModule } from './modules/config/config.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationModule } from './modules/notification/notification.module';
import { BlogModule } from './modules/blog/blog.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { QueueModule } from './core/queue/queue.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    HealthModule,
    PrismaModule,
    QueueModule,
    EventsModule,
    AuthorizationModule,
    AdminShellModule.forRoot(),
    AdminModule,
    AuditModule,
    UserModule,
    MerchantModule,
    ConfigModule,
    MediaModule,
    NotificationModule,
    BlogModule,
    IntegrationModule,
    AuthModule.forRoot({
      jwt: {
        accessTokenSecret:
          process.env.JWT_ACCESS_SECRET ?? 'change-me-in-production',
        accessTokenTtlSeconds: 15 * 60,
        refreshTokenTtlDays: 30,
      },
      imports: [AdminModule, UserModule],
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
