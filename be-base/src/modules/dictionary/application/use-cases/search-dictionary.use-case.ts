import { Inject, Injectable } from '@nestjs/common';
import type { DictionaryEntry } from '../../domain/entities/dictionary-entry.entity';
import {
  DICTIONARY_REPOSITORY,
  type IDictionaryRepository,
} from '../../domain/repositories/dictionary.repository';

export interface SearchDictionaryInput {
  query?: string;
  jlptLevel?: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class SearchDictionaryUseCase {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: IDictionaryRepository,
  ) {}

  async execute(
    input: SearchDictionaryInput,
  ): Promise<{ data: DictionaryEntry[]; total: number }> {
    return this.repo.search({
      query: input.query,
      jlptLevel: input.jlptLevel,
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
