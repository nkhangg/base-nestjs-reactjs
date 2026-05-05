export interface ProfileSnapshot {
  createdAt: Date;
  isActive: boolean;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ProfileUpdateData {
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface IProfileProvider {
  readonly type: string;
  findProfileById(id: string): Promise<ProfileSnapshot | null>;
  updateProfile(id: string, data: ProfileUpdateData): Promise<void>;
}

export const PROFILE_PROVIDERS = Symbol('PROFILE_PROVIDERS');
