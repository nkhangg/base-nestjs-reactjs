import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { TOKEN_SERVICE } from './domain/services/token.service';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import {
  JwtTokenService,
  type JwtConfig,
} from './infrastructure/jwt-token.service';
import { JwtMiddleware } from './infrastructure/jwt.middleware';
import { RefreshMiddleware } from './infrastructure/refresh.middleware';
import { AuthGuard } from './infrastructure/auth.guard';
import { PrismaSessionRepository } from './infrastructure/repositories/prisma-session.repository';
import { AuthController } from './presentation/http/auth.controller';

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
        LoginUseCase,
        LogoutUseCase,
        RefreshTokenUseCase,
        AuthGuard,
      ],
      exports: [TOKEN_SERVICE, SESSION_REPOSITORY, AuthGuard, LoginUseCase],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware, RefreshMiddleware).forRoutes('*');
  }
}
