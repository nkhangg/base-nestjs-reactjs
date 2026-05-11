import { Inject, Injectable } from '@nestjs/common';
import type { ICredentialValidator } from '../../../../core/auth/domain/services/credential-validator.interface';
import type { IAuthIdentity } from '../../../../core/auth/domain/services/auth-identity.interface';
import type { ITokenService } from '../../../../core/auth/domain/services/token.service';
import { TOKEN_SERVICE } from '../../../../core/auth/domain/services/token.service';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';

@Injectable()
export class UserCredentialValidator implements ICredentialValidator {
  readonly type = 'user';

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async validate(
    email: string,
    password: string,
  ): Promise<IAuthIdentity | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.isActive || !user.hasPassword) return null;

    const valid = this.tokenService.compareTokenHash(
      password,
      user.passwordHash,
    );
    if (!valid) return null;

    return {
      id: user.id.value,
      email: user.email,
      type: 'user',
      isAdmin: false,
    };
  }
}
