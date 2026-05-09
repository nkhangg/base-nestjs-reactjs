import { Injectable } from '@nestjs/common';
import type { Contact, ContactStatus } from '../../domain/entities/contact.entity';
import type {
  IContactRepository,
  FindAllContactsOptions,
} from '../../domain/repositories/contact.repository';

@Injectable()
export class InMemoryContactRepository implements IContactRepository {
  private readonly store = new Map<string, Contact>();

  async findById(id: string): Promise<Contact | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(
    opts: FindAllContactsOptions,
  ): Promise<{ data: Contact[]; total: number }> {
    let items = Array.from(this.store.values());

    if (opts.status) {
      items = items.filter((c) => c.status === (opts.status as ContactStatus));
    }

    if (opts.search) {
      const q = opts.search.toLowerCase();
      items = items.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q),
      );
    }

    const sortKey = opts.sortBy ?? 'createdAt';
    const sortDir = opts.sortDir ?? 'desc';
    items.sort((a, b) => {
      const av = a[sortKey].getTime();
      const bv = b[sortKey].getTime();
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    const total = items.length;
    const skip = (opts.page - 1) * opts.pageSize;
    return { data: items.slice(skip, skip + opts.pageSize), total };
  }

  async save(contact: Contact): Promise<void> {
    this.store.set(contact.id.value, contact);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  clear(): void {
    this.store.clear();
  }
}
