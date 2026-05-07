import { BaseEntity } from '../../../../shared/domain/base-entity';
import { UserId } from '../value-objects/user-id.vo';

export interface UserProps {
  email: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  xpTotal: number;
  streakCount: number;
  settings: Record<string, unknown>;
  createdAt: Date;
}

export class User extends BaseEntity<UserId> {
  private props: UserProps;

  private constructor(id: UserId, props: UserProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    email: string;
    passwordHash: string;
    role?: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  }): User {
    return new User(UserId.create(), {
      email: params.email,
      passwordHash: params.passwordHash,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      phone: null,
      avatarUrl: params.avatarUrl ?? null,
      role: params.role ?? 'member',
      isActive: true,
      xpTotal: 0,
      streakCount: 0,
      settings: {},
      createdAt: new Date(),
    });
  }

  static createFromOAuth(params: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    role?: string;
  }): User {
    return new User(UserId.create(), {
      email: params.email,
      passwordHash: '',
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      phone: null,
      avatarUrl: params.avatarUrl ?? null,
      role: params.role ?? 'member',
      isActive: true,
      xpTotal: 0,
      streakCount: 0,
      settings: {},
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: UserProps): User {
    return new User(UserId.from(id), props);
  }

  deactivate(): void {
    this.props.isActive = false;
  }

  activate(): void {
    this.props.isActive = true;
  }

  updateRole(role: string): void {
    this.props.role = role;
  }

  updateEmail(email: string): void {
    this.props.email = email;
  }

  updatePassword(newHash: string): void {
    this.props.passwordHash = newHash;
  }

  updateProfile(data: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  }): void {
    if (data.firstName !== undefined) this.props.firstName = data.firstName;
    if (data.lastName !== undefined) this.props.lastName = data.lastName;
    if (data.phone !== undefined) this.props.phone = data.phone;
    if (data.avatarUrl !== undefined) this.props.avatarUrl = data.avatarUrl;
  }

  addXp(amount: number): void {
    if (amount <= 0) return;
    this.props.xpTotal += amount;
  }

  updateStreak(count: number): void {
    this.props.streakCount = count;
  }

  updateSettings(patch: Record<string, unknown>): void {
    this.props.settings = { ...this.props.settings, ...patch };
  }

  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get hasPassword(): boolean {
    return !!this.props.passwordHash;
  }
  get firstName(): string | null | undefined {
    return this.props.firstName;
  }
  get lastName(): string | null | undefined {
    return this.props.lastName;
  }
  get phone(): string | null | undefined {
    return this.props.phone;
  }
  get avatarUrl(): string | null | undefined {
    return this.props.avatarUrl;
  }
  get role(): string {
    return this.props.role;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get xpTotal(): number {
    return this.props.xpTotal;
  }
  get streakCount(): number {
    return this.props.streakCount;
  }
  get settings(): Record<string, unknown> {
    return this.props.settings;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
