import { Inject, Injectable } from '@nestjs/common';
import type { IPasswordUpdater } from '../../../core/auth/domain/services/password-updater.interface';
import type { IAdminRepository } from '../domain/repositories/admin.repository';
import { ADMIN_REPOSITORY } from '../domain/repositories/admin.repository';

@Injectable()
export class AdminPasswordUpdater implements IPasswordUpdater {
  readonly type = 'admin';

  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
  ) {}

  async findByEmail(
    email: string,
  ): Promise<{ userId: string; isActive: boolean } | null> {
    const admin = await this.adminRepo.findByEmail(email);
    if (!admin) return null;
    return { userId: admin.id.value, isActive: admin.isActive };
  }

  async findHashById(userId: string): Promise<string | null> {
    const admin = await this.adminRepo.findById(userId);
    return admin?.passwordHash ?? null;
  }

  async updatePassword(userId: string, newHash: string): Promise<void> {
    const admin = await this.adminRepo.findById(userId);
    if (!admin) return;
    admin.updatePassword(newHash);
    await this.adminRepo.save(admin);
  }
}
