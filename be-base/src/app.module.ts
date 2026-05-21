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
import { AdminCredentialValidator } from './modules/admin/application/validators/admin-credential.validator';
import { AuditModule } from './modules/audit';
import { UserModule } from './modules/user/user.module';
import { UserCredentialValidator } from './modules/user/application/validators/user-credential.validator';
import { MerchantModule } from './modules/merchant/merchant.module';
import { ConfigModule } from './modules/config/config.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationModule } from './modules/notification/notification.module';
import { BlogModule } from './modules/blog/blog.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { QueueModule } from './core/queue/queue.module';
import { MailModule } from './core/mail/mail.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    HealthModule,
    PrismaModule,
    QueueModule,
    MailModule,
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
      credentialValidators: [AdminCredentialValidator, UserCredentialValidator],
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
