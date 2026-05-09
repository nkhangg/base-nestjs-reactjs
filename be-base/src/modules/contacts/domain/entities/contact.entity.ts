import { BaseEntity } from '../../../../shared/domain/base-entity';
import { ContactId } from '../value-objects/contact-id.vo';

export type ContactStatus = 'PENDING' | 'READ' | 'RESPONDED' | 'CLOSED';

export interface ContactProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  note: string | null;
  replyMessage: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Contact extends BaseEntity<ContactId> {
  private props: ContactProps;

  private constructor(id: ContactId, props: ContactProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Contact {
    const now = new Date();
    return new Contact(ContactId.create(), {
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phone: params.phone ?? null,
      subject: params.subject,
      message: params.message,
      status: 'PENDING',
      note: null,
      replyMessage: null,
      respondedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: ContactProps): Contact {
    return new Contact(ContactId.from(id), props);
  }

  markAsRead(): void {
    this.props.status = 'READ';
    this.props.updatedAt = new Date();
  }

  markAsResponded(): void {
    this.props.status = 'RESPONDED';
    this.props.respondedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markAsClosed(): void {
    this.props.status = 'CLOSED';
    this.props.updatedAt = new Date();
  }

  reply(replyMessage: string): void {
    this.props.status = 'RESPONDED';
    if (!this.props.respondedAt) {
      this.props.respondedAt = new Date();
    }
    this.props.replyMessage = replyMessage;
    this.props.updatedAt = new Date();
  }

  updateStatus(status: ContactStatus, note?: string): void {
    this.props.status = status;
    if (status === 'RESPONDED' && !this.props.respondedAt) {
      this.props.respondedAt = new Date();
    }
    if (note !== undefined) this.props.note = note;
    this.props.updatedAt = new Date();
  }

  updateNote(note: string): void {
    this.props.note = note;
    this.props.updatedAt = new Date();
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get firstName(): string { return this.props.firstName; }
  get lastName(): string { return this.props.lastName; }
  get email(): string { return this.props.email; }
  get phone(): string | null { return this.props.phone; }
  get subject(): string { return this.props.subject; }
  get message(): string { return this.props.message; }
  get status(): ContactStatus { return this.props.status; }
  get note(): string | null { return this.props.note; }
  get replyMessage(): string | null { return this.props.replyMessage; }
  get respondedAt(): Date | null { return this.props.respondedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
