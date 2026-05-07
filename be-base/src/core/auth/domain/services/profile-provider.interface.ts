export interface ProfileSnapshot {
  createdAt: Date;
  isActive: boolean;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ProfileUpdateData {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface IProfileProvider {
  readonly type: string;
  findProfileById(id: string): Promise<ProfileSnapshot | null>;
  updateProfile(id: string, data: ProfileUpdateData): Promise<void>;
}

export const PROFILE_PROVIDERS = Symbol('PROFILE_PROVIDERS');
