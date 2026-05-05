import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
} from '../domain/repositories/admin.repository';
import type {
  IProfileProvider,
  ProfileSnapshot,
  ProfileUpdateData,
} from '../../../core/auth/domain/services/profile-provider.interface';

@Injectable()
export class AdminProfileProvider implements IProfileProvider {
  readonly type = 'admin';

  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
  ) {}

  async findProfileById(id: string): Promise<ProfileSnapshot | null> {
    const admin = await this.adminRepo.findById(id);
    if (!admin) return null;
    return {
      createdAt: admin.createdAt,
      isActive: admin.isActive,
      name: admin.name,
      phone: admin.phone,
      avatarUrl: admin.avatarUrl,
    };
  }

  async updateProfile(id: string, data: ProfileUpdateData): Promise<void> {
    const admin = await this.adminRepo.findById(id);
    if (!admin) return;
    admin.updateProfile(data);
    await this.adminRepo.save(admin);
  }
}
