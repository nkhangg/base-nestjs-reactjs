import { BaseEntity } from '../../../../shared/domain/base-entity';
import { UserId } from '../value-objects/user-id.vo';

export interface UserProps {
  email: string;
  passwordHash: string;
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

  updateRole(role: string): void {
    this.props.role = role;
  }

  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
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
