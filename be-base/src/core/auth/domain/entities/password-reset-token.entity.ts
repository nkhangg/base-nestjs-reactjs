import { createHash, randomBytes, randomUUID } from 'crypto';

const EXPIRES_IN_MS = 60 * 60 * 1000; // 1 hour

export class PasswordResetToken {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly userType: string,
    readonly tokenHash: string,
    readonly expiresAt: Date,
    readonly usedAt: Date | null,
    readonly createdAt: Date,
  ) {}

  static generate(
    userId: string,
    userType: string,
  ): { entity: PasswordResetToken; plainToken: string } {
    const plainToken = randomBytes(32).toString('hex');
    const tokenHash = PasswordResetToken.hashToken(plainToken);
    const now = new Date();
    return {
      entity: new PasswordResetToken(
        randomUUID(),
        userId,
        userType,
        tokenHash,
        new Date(now.getTime() + EXPIRES_IN_MS),
        null,
        now,
      ),
      plainToken,
    };
  }

  static reconstitute(params: {
    id: string;
    userId: string;
    userType: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }): PasswordResetToken {
    return new PasswordResetToken(
      params.id,
      params.userId,
      params.userType,
      params.tokenHash,
      params.expiresAt,
      params.usedAt,
      params.createdAt,
    );
  }

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  get isUsed(): boolean {
    return this.usedAt !== null;
  }

  get isValid(): boolean {
    return !this.isExpired && !this.isUsed;
  }

  markUsed(): PasswordResetToken {
    return new PasswordResetToken(
      this.id,
      this.userId,
      this.userType,
      this.tokenHash,
      this.expiresAt,
      new Date(),
      this.createdAt,
    );
  }
}
