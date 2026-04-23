export { AuthModule } from './auth.module';
export { AuthGuard, Public, IS_PUBLIC } from './infrastructure/auth.guard';
export { LoginUseCase } from './application/use-cases/login.use-case';
export type {
  LoginInput,
  LoginOutput,
} from './application/use-cases/login.use-case';
export type { AccessTokenPayload } from './domain/services/token.service';
export type { IAuthIdentity } from './domain/services/auth-identity.interface';
export type { ICredentialValidator } from './domain/services/credential-validator.interface';
export { CREDENTIAL_VALIDATORS } from './domain/services/credential-validator.interface';
export { TOKEN_SERVICE } from './domain/services/token.service';
export { SESSION_REPOSITORY } from './domain/repositories/session.repository';
