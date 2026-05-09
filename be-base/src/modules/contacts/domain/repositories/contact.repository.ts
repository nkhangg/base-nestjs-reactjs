import type { Contact, ContactStatus } from '../entities/contact.entity';

export const CONTACT_REPOSITORY = Symbol('CONTACT_REPOSITORY');

export interface FindAllContactsOptions {
  page: number;
  pageSize: number;
  status?: ContactStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortDir?: 'asc' | 'desc';
}

export interface IContactRepository {
  findById(id: string): Promise<Contact | null>;
  findAll(opts: FindAllContactsOptions): Promise<{ data: Contact[]; total: number }>;
  save(contact: Contact): Promise<void>;
  delete(id: string): Promise<void>;
}
