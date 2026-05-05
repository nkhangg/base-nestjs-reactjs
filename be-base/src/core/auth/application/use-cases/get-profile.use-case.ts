import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  PROFILE_PROVIDERS,
  type IProfileProvider,
  type ProfileSnapshot,
} from '../../domain/services/profile-provider.interface';

export interface GetProfileInput {
  userId: string;
  type: string;
  email: string;
  isAdmin?: boolean;
}

export interface GetProfileOutput {
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
export class GetProfileUseCase {
  private readonly providers: IProfileProvider[];

  constructor(
    @Optional() @Inject(PROFILE_PROVIDERS) providers: IProfileProvider | IProfileProvider[] = [],
  ) {
    this.providers = Array.isArray(providers) ? providers : providers ? [providers] : [];
  }

  async execute(input: GetProfileInput): Promise<GetProfileOutput> {
    const provider = this.providers.find((p) => p.type === input.type);
    const snapshot: ProfileSnapshot | null = provider
      ? await provider.findProfileById(input.userId)
      : null;

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
