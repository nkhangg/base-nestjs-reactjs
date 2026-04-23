import { BaseEntity } from '../../../../shared/domain/base-entity';
import { AdminId } from '../value-objects/admin-id.vo';

export interface AdminProps {
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export class Admin extends BaseEntity<AdminId> {
  private props: AdminProps;

  private constructor(id: AdminId, props: AdminProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    email: string;
    passwordHash: string;
    role?: string;
  }): Admin {
    return new Admin(AdminId.create(), {
      email: params.email,
      passwordHash: params.passwordHash,
      role: params.role ?? 'admin',
      isActive: true,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: AdminProps): Admin {
    return new Admin(AdminId.from(id), props);
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
