import { Module } from '@nestjs/common';
import { AdminShellModule } from './core/admin-shell';
import { AuthModule } from './core/auth';
import { AuthorizationModule } from './core/authorization';
import { EventsModule } from './core/events';
import { AdminModule } from './modules/admin';
import { AuditModule } from './modules/audit';
import { UserModule } from './modules/user/user.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    AuthorizationModule,
    AdminShellModule.forRoot(),
    AdminModule,
    AuditModule,
    UserModule,
    MerchantModule,
    AuthModule.forRoot({
      jwt: {
        accessTokenSecret:
          process.env.JWT_ACCESS_SECRET ?? 'change-me-in-production',
        accessTokenTtlSeconds: 15 * 60,
        refreshTokenTtlDays: 30,
      },
      imports: [AdminModule],
    }),
  ],
})
export class AppModule {}
