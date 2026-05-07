import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  DICTIONARY_REPOSITORY,
  type IDictionaryRepository,
} from '../../domain/repositories/dictionary.repository';

export type DeleteDictionaryEntryResult = Result<void, string>;

@Injectable()
export class DeleteDictionaryEntryUseCase {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: IDictionaryRepository,
  ) {}

  async execute(id: string): Promise<DeleteDictionaryEntryResult> {
    const entry = await this.repo.findById(id);
    if (!entry) return { ok: false, error: 'NOT_FOUND' };

    await this.repo.delete(id);
    return { ok: true, value: undefined };
  }
}
