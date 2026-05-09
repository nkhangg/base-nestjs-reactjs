import { Inject, Injectable } from '@nestjs/common';
import type { Contact, ContactStatus } from '../../domain/entities/contact.entity';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/repositories/contact.repository';

export interface ListContactsInput {
  page: number;
  pageSize: number;
  status?: ContactStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortDir?: 'asc' | 'desc';
}

@Injectable()
export class ListContactsUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepo: IContactRepository,
  ) {}

  async execute(input: ListContactsInput): Promise<{ data: Contact[]; total: number }> {
    return this.contactRepo.findAll({
      page: input.page,
      pageSize: input.pageSize,
      status: input.status,
      search: input.search,
      sortBy: input.sortBy ?? 'createdAt',
      sortDir: input.sortDir ?? 'desc',
    });
  }
}
