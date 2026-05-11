import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  Type,
} from '@nestjs/common';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/repositories/password-reset-token.repository';
import { TOKEN_SERVICE } from './domain/services/token.service';
import {
  CREDENTIAL_VALIDATORS,
  type ICredentialValidator,
} from './domain/services/credential-validator.interface';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { OAuthLoginUseCase } from './application/use-cases/oauth-login.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { GoogleOAuthProvider } from './infrastructure/google-oauth.provider';
import { DiscordOAuthProvider } from './infrastructure/discord-oauth.provider';
import { OAUTH_IDENTITY_PROVIDERS } from './domain/services/oauth-identity-provider.interface';
import {
  JwtTokenService,
  type JwtConfig,
} from './infrastructure/jwt-token.service';
import { JwtMiddleware } from './infrastructure/jwt.middleware';
import { RefreshMiddleware } from './infrastructure/refresh.middleware';
import { AuthGuard } from './infrastructure/auth.guard';
import { PrismaPasswordResetTokenRepository } from './infrastructure/repositories/prisma-password-reset-token.repository';
import { PrismaSessionRepository } from './infrastructure/repositories/prisma-session.repository';
import { AuthController } from './presentation/http/auth.controller';

export interface AuthModuleOptions {
  jwt: JwtConfig;
  /** Modules providing validator classes referenced in `credentialValidators` */
  imports?: any[];
  /**
   * Credential validator classes aggregated into CREDENTIAL_VALIDATORS.
   * NestJS doesn't merge `multi: true` providers across module boundaries,
   * so callers must list each validator class here and ensure the owning
   * module exports it.
   */
  credentialValidators?: Type<ICredentialValidator>[];
}

@Module({})
export class AuthModule implements NestModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    const credentialValidatorClasses = options.credentialValidators ?? [];
    return {
      module: AuthModule,
      global: true,
      imports: [...(options.imports ?? [])],
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
        LoginUseCase,
        LogoutUseCase,
        RefreshTokenUseCase,
        ChangePasswordUseCase,
        ForgotPasswordUseCase,
        ResetPasswordUseCase,
        GetProfileUseCase,
        UpdateProfileUseCase,
        OAuthLoginUseCase,
        RegisterUseCase,
        GoogleOAuthProvider,
        DiscordOAuthProvider,
        {
          provide: OAUTH_IDENTITY_PROVIDERS,
          useFactory: (
            google: GoogleOAuthProvider,
            discord: DiscordOAuthProvider,
          ) => [google, discord],
          inject: [GoogleOAuthProvider, DiscordOAuthProvider],
        },
        {
          provide: CREDENTIAL_VALIDATORS,
          useFactory: (...validators: ICredentialValidator[]) => validators,
          inject: credentialValidatorClasses,
        },
        AuthGuard,
      ],
      exports: [TOKEN_SERVICE, SESSION_REPOSITORY, AuthGuard, LoginUseCase],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware, RefreshMiddleware).forRoutes('*');
  }
}
