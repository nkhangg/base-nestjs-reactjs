import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import type { Contact, ContactStatus } from '../../domain/entities/contact.entity';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/repositories/contact.repository';

export interface UpdateContactStatusInput {
  id: string;
  status: ContactStatus;
  note?: string;
}

@Injectable()
export class UpdateContactStatusUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepo: IContactRepository,
  ) {}

  async execute(
    input: UpdateContactStatusInput,
  ): Promise<Result<Contact, 'NOT_FOUND'>> {
    const contact = await this.contactRepo.findById(input.id);
    if (!contact) return { ok: false, error: 'NOT_FOUND' };

    contact.updateStatus(input.status, input.note);
    await this.contactRepo.save(contact);

    return { ok: true, value: contact };
  }
}
