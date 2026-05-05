import { BaseEntity } from '../../../../shared/domain/base-entity';
import { UserId } from '../value-objects/user-id.vo';

export interface UserProps {
  email: string;
  passwordHash: string;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
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
  }): User {
    return new User(UserId.create(), {
      email: params.email,
      passwordHash: params.passwordHash,
      name: null,
      phone: null,
      avatarUrl: null,
      role: params.role ?? 'member',
      isActive: true,
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
    name?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  }): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.phone !== undefined) this.props.phone = data.phone;
    if (data.avatarUrl !== undefined) this.props.avatarUrl = data.avatarUrl;
  }

  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get name(): string | null | undefined {
    return this.props.name;
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
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
