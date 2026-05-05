import { Inject, Injectable } from '@nestjs/common';
import type { IPasswordUpdater } from '../../../core/auth/domain/services/password-updater.interface';
import type { IUserRepository } from '../domain/repositories/user.repository';
import { USER_REPOSITORY } from '../domain/repositories/user.repository';

@Injectable()
export class UserPasswordUpdater implements IPasswordUpdater {
  readonly type = 'user';

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async findByEmail(
    email: string,
  ): Promise<{ userId: string; isActive: boolean } | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return null;
    return { userId: user.id.value, isActive: user.isActive };
  }

  async findHashById(userId: string): Promise<string | null> {
    const user = await this.userRepo.findById(userId);
    return user?.passwordHash ?? null;
  }

  async updatePassword(userId: string, newHash: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) return;
    user.updatePassword(newHash);
    await this.userRepo.save(user);
  }
}
