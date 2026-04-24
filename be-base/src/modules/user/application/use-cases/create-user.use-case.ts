import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import { User } from '../../domain/entities/user.entity';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';
import {
  TOKEN_SERVICE,
  type ITokenService,
} from '../../../../core/auth/domain/services/token.service';
import { AuthorizationService } from '../../../../core/authorization';

export interface CreateUserInput {
  email: string;
  password: string;
  role?: string;
}

export type CreateUserResult = Result<{ userId: string }, string>;

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserResult> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) return { ok: false, error: 'EMAIL_ALREADY_EXISTS' };

    const passwordHash = this.tokenService.hashToken(input.password);
    const roleName = input.role ?? 'member';
    const user = User.create({
      email: input.email,
      passwordHash,
      role: roleName,
    });

    await this.userRepo.save(user);
    await this.authorizationService.assignRoleWithFallback(
      user.id.value,
      'user',
      roleName,
      'member',
    );

    return { ok: true, value: { userId: user.id.value } };
  }
}
