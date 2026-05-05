export interface IPasswordUpdater {
  readonly type: string;
  findByEmail(
    email: string,
  ): Promise<{ userId: string; isActive: boolean } | null>;
  findHashById(userId: string): Promise<string | null>;
  updatePassword(userId: string, newHash: string): Promise<void>;
}

export const PASSWORD_UPDATERS = Symbol('PASSWORD_UPDATERS');
