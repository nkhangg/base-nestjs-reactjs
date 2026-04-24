import { Module } from '@nestjs/common';
import { AdminShellModule } from './core/admin-shell';
import { AuthModule } from './core/auth';
import { AuthorizationModule } from './core/authorization';
import { AdminModule } from './modules/admin';
import { UserModule } from './modules/user/user.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { ConfigModule } from './modules/config/config.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthorizationModule,
    AdminShellModule.forRoot(),
    AdminModule,
    UserModule,
    MerchantModule,
    ConfigModule,
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
