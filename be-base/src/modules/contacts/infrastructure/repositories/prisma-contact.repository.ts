import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { Contact } from '../../domain/entities/contact.entity';
import type {
  IContactRepository,
  FindAllContactsOptions,
} from '../../domain/repositories/contact.repository';
import { ContactMapper } from '../mappers/contact.mapper';

@Injectable()
export class PrismaContactRepository implements IContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Contact | null> {
    const r = await this.prisma.contact.findUnique({ where: { id } });
    return r ? ContactMapper.toDomain(r) : null;
  }

  async findAll(
    opts: FindAllContactsOptions,
  ): Promise<{ data: Contact[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (opts.status) where['status'] = opts.status;

    if (opts.search) {
      where['OR'] = [
        { firstName: { contains: opts.search, mode: 'insensitive' } },
        { lastName: { contains: opts.search, mode: 'insensitive' } },
        { email: { contains: opts.search, mode: 'insensitive' } },
        { subject: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const sortKey = opts.sortBy ?? 'createdAt';
    const sortDir = opts.sortDir ?? 'desc';
    const skip = (opts.page - 1) * opts.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: opts.pageSize,
        orderBy: { [sortKey]: sortDir },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { data: rows.map(ContactMapper.toDomain), total };
  }

  async save(contact: Contact): Promise<void> {
    const data = ContactMapper.toPrisma(contact);
    await this.prisma.contact.upsert({
      where: { id: contact.id.value },
      create: { id: contact.id.value, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contact.delete({ where: { id } });
  }
}
