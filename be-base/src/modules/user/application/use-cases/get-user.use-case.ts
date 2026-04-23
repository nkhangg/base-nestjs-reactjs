import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';
import type { User } from '../../domain/entities/user.entity';

export type GetUserResult = Result<User, string>;

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string): Promise<GetUserResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) return { ok: false, error: 'USER_NOT_FOUND' };
    return { ok: true, value: user };
  }
}
