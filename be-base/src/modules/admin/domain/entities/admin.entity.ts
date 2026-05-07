import { BaseEntity } from '../../../../shared/domain/base-entity';
import { AdminId } from '../value-objects/admin-id.vo';

export interface AdminProps {
  email: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export class Admin extends BaseEntity<AdminId> {
  private props: AdminProps;

  private constructor(id: AdminId, props: AdminProps) {
    super(id);
    this.props = props;
  }

  static create(params: { email: string; passwordHash: string }): Admin {
    return new Admin(AdminId.create(), {
      email: params.email,
      passwordHash: params.passwordHash,
      firstName: null,
      lastName: null,
      phone: null,
      avatarUrl: null,
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

  activate(): void {
    this.props.isActive = true;
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

  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
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
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
