import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../domain/repositories/user.repository';
import type {
  IProfileProvider,
  ProfileSnapshot,
  ProfileUpdateData,
} from '../../../core/auth/domain/services/profile-provider.interface';

@Injectable()
export class UserProfileProvider implements IProfileProvider {
  readonly type = 'user';

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async findProfileById(id: string): Promise<ProfileSnapshot | null> {
    const user = await this.userRepo.findById(id);
    if (!user) return null;
    return {
      createdAt: user.createdAt,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateProfile(id: string, data: ProfileUpdateData): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) return;
    user.updateProfile(data);
    await this.userRepo.save(user);
  }
}
