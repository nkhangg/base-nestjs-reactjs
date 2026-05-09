import { ContactStatus as PrismaContactStatus } from '@prisma/client';
import { Contact, type ContactStatus } from '../../domain/entities/contact.entity';

export interface ContactRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: PrismaContactStatus;
  note: string | null;
  replyMessage: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ContactMapper {
  static toDomain(r: ContactRecord): Contact {
    return Contact.reconstitute(r.id, {
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      subject: r.subject,
      message: r.message,
      status: r.status as ContactStatus,
      note: r.note,
      replyMessage: r.replyMessage,
      respondedAt: r.respondedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }

  static toPrisma(contact: Contact): Omit<ContactRecord, 'id'> {
    return {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      status: contact.status as PrismaContactStatus,
      note: contact.note,
      replyMessage: contact.replyMessage,
      respondedAt: contact.respondedAt,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}
