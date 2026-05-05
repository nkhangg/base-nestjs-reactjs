import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bullmq';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/repositories/password-reset-token.repository';
import { TOKEN_SERVICE } from './domain/services/token.service';
import { MAILER_SERVICE } from './domain/services/mailer.interface';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import {
  JwtTokenService,
  type JwtConfig,
} from './infrastructure/jwt-token.service';
import { JwtMiddleware } from './infrastructure/jwt.middleware';
import { RefreshMiddleware } from './infrastructure/refresh.middleware';
import { AuthGuard } from './infrastructure/auth.guard';
import { MailProcessor } from './infrastructure/mail.processor';
import { MailQueueService } from './infrastructure/mail-queue.service';
import { NodemailerMailerService } from './infrastructure/nodemailer-mailer.service';
import { PrismaPasswordResetTokenRepository } from './infrastructure/repositories/prisma-password-reset-token.repository';
import { PrismaSessionRepository } from './infrastructure/repositories/prisma-session.repository';
import { AuthController } from './presentation/http/auth.controller';
import { QUEUE_NAMES } from '../queue/queue.constants';

export interface AuthModuleOptions {
  jwt: JwtConfig;
  /** Modules that provide CREDENTIAL_VALIDATORS (multi: true) for LoginUseCase */
  imports?: any[];
}

@Module({})
export class AuthModule implements NestModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      imports: [
        ...(options.imports ?? []),
        BullModule.registerQueue({ name: QUEUE_NAMES.MAIL }),
        MailerModule.forRoot({
          transport: {
            host: process.env.MAIL_HOST ?? 'localhost',
            port: parseInt(process.env.MAIL_PORT ?? '1025', 10),
            auth:
              process.env.MAIL_USER
                ? {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS ?? '',
                  }
                : undefined,
          },
          defaults: {
            from: process.env.MAIL_FROM ?? 'No Reply <noreply@example.com>',
          },
          template: {
            dir: join(__dirname, 'infrastructure', 'templates'),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: TOKEN_SERVICE,
          useFactory: () => new JwtTokenService(options.jwt),
        },
        {
          provide: SESSION_REPOSITORY,
          useClass: PrismaSessionRepository,
        },
        {
          provide: PASSWORD_RESET_TOKEN_REPOSITORY,
          useClass: PrismaPasswordResetTokenRepository,
        },
        NodemailerMailerService,
        MailQueueService,
        MailProcessor,
        {
          provide: MAILER_SERVICE,
          useExisting: MailQueueService,
        },
        LoginUseCase,
        LogoutUseCase,
        RefreshTokenUseCase,
        ChangePasswordUseCase,
        ForgotPasswordUseCase,
        ResetPasswordUseCase,
        GetProfileUseCase,
        UpdateProfileUseCase,
        AuthGuard,
      ],
      exports: [TOKEN_SERVICE, SESSION_REPOSITORY, AuthGuard, LoginUseCase],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware, RefreshMiddleware).forRoutes('*');
  }
}
