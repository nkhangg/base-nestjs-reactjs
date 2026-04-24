import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';

export interface UpdateUserInfoInput {
  userId: string;
  email?: string;
}

export type UpdateUserInfoResult = Result<void, string>;

@Injectable()
export class UpdateUserInfoUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async execute(input: UpdateUserInfoInput): Promise<UpdateUserInfoResult> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) return { ok: false, error: 'USER_NOT_FOUND' };

    if (input.email && input.email !== user.email) {
      const existing = await this.userRepo.findByEmail(input.email);
      if (existing) return { ok: false, error: 'EMAIL_ALREADY_EXISTS' };
      user.updateEmail(input.email);
    }

    await this.userRepo.save(user);
    return { ok: true, value: undefined };
  }
}
