import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import {
  PROFILE_PROVIDERS,
  type IProfileProvider,
  type ProfileUpdateData,
  type ProfileSnapshot,
} from '../../domain/services/profile-provider.interface';

export interface UpdateProfileInput {
  userId: string;
  type: string;
  email: string;
  isAdmin?: boolean;
  data: ProfileUpdateData;
}

export interface UpdateProfileOutput {
  userId: string;
  email: string;
  isAdmin?: boolean;
  role: string;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt?: Date | null;
  isActive?: boolean;
}

@Injectable()
export class UpdateProfileUseCase {
  private readonly providers: IProfileProvider[];

  constructor(
    @Optional() @Inject(PROFILE_PROVIDERS) providers: IProfileProvider | IProfileProvider[] = [],
  ) {
    this.providers = Array.isArray(providers) ? providers : providers ? [providers] : [];
  }

  async execute(input: UpdateProfileInput): Promise<UpdateProfileOutput> {
    const provider = this.providers.find((p) => p.type === input.type);
    if (!provider) throw new NotFoundException('Không tìm thấy tài khoản');

    await provider.updateProfile(input.userId, input.data);

    const snapshot: ProfileSnapshot | null = await provider.findProfileById(input.userId);

    return {
      userId: input.userId,
      email: input.email,
      isAdmin: input.isAdmin,
      role: input.type,
      name: snapshot?.name ?? null,
      phone: snapshot?.phone ?? null,
      avatarUrl: snapshot?.avatarUrl ?? null,
      createdAt: snapshot?.createdAt ?? null,
      isActive: snapshot?.isActive ?? true,
    };
  }
}
