import { IAuthIdentity } from './auth-identity.interface';

export interface ICredentialValidator {
  /**
   * Phải khớp với field `type` trong LoginDto
   * @example 'user' | 'merchant' | 'admin'
   */
  readonly type: string;

  /**
   * Trả về IAuthIdentity nếu credentials hợp lệ
   * Trả về null nếu không tìm thấy hoặc sai password
   */
  validate(email: string, password: string): Promise<IAuthIdentity | null>;
}

/**
 * Multi-provider token — mỗi module đăng ký validator của mình:
 *
 * providers: [
 *   { provide: CREDENTIAL_VALIDATORS, useClass: UserCredentialValidator, multi: true }
 * ]
 */
export const CREDENTIAL_VALIDATORS = Symbol('CREDENTIAL_VALIDATORS');
