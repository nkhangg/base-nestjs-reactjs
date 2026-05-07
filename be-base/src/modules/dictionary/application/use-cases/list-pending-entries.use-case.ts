import { Inject, Injectable } from '@nestjs/common';
import type { DictionaryEntry } from '../../domain/entities/dictionary-entry.entity';
import {
  DICTIONARY_REPOSITORY,
  type IDictionaryRepository,
} from '../../domain/repositories/dictionary.repository';

export interface ListPendingEntriesInput {
  page: number;
  pageSize: number;
}

@Injectable()
export class ListPendingEntriesUseCase {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: IDictionaryRepository,
  ) {}

  async execute(
    input: ListPendingEntriesInput,
  ): Promise<{ data: DictionaryEntry[]; total: number }> {
    return this.repo.findByStatus('pending', input.page, input.pageSize);
  }
}
