import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import type { Contact } from '../../domain/entities/contact.entity';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/repositories/contact.repository';

@Injectable()
export class GetContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepo: IContactRepository,
  ) {}

  async execute(id: string): Promise<Result<Contact, 'NOT_FOUND'>> {
    const contact = await this.contactRepo.findById(id);
    if (!contact) return { ok: false, error: 'NOT_FOUND' };
    return { ok: true, value: contact };
  }
}
