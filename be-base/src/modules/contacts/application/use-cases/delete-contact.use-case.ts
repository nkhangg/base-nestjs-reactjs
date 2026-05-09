import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  CONTACT_REPOSITORY,
  type IContactRepository,
} from '../../domain/repositories/contact.repository';

@Injectable()
export class DeleteContactUseCase {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepo: IContactRepository,
  ) {}

  async execute(id: string): Promise<Result<void, 'NOT_FOUND'>> {
    const contact = await this.contactRepo.findById(id);
    if (!contact) return { ok: false, error: 'NOT_FOUND' };

    await this.contactRepo.delete(id);
    return { ok: true, value: undefined };
  }
}
