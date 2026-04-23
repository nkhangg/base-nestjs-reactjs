import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../../../core/auth/domain/repositories/session.repository';
import { AuthorizationService } from '../../../../core/authorization';

export interface DeactivateUserInput {
  userId: string;
}

export type DeactivateUserResult = Result<void, string>;

@Injectable()
export class DeactivateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(input: DeactivateUserInput): Promise<DeactivateUserResult> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) return { ok: false, error: 'USER_NOT_FOUND' };
    if (!user.isActive) return { ok: false, error: 'USER_ALREADY_INACTIVE' };

    user.deactivate();
    await this.userRepo.save(user);

    const sessions = await this.sessionRepo.findByUserId(input.userId, true);
    await Promise.all(
      sessions.map((s) => {
        s.revoke();
        return this.sessionRepo.save(s);
      }),
    );

    this.authorizationService.invalidateCache(input.userId, 'user');

    return { ok: true, value: undefined };
  }
}
