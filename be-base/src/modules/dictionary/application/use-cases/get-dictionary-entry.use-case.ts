import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import type { DictionaryEntry } from '../../domain/entities/dictionary-entry.entity';
import {
  DICTIONARY_REPOSITORY,
  type IDictionaryRepository,
} from '../../domain/repositories/dictionary.repository';

export type GetDictionaryEntryResult = Result<DictionaryEntry, string>;

@Injectable()
export class GetDictionaryEntryUseCase {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: IDictionaryRepository,
  ) {}

  async execute(id: string): Promise<GetDictionaryEntryResult> {
    const entry = await this.repo.findById(id);
    if (!entry) return { ok: false, error: 'NOT_FOUND' };
    return { ok: true, value: entry };
  }
}
