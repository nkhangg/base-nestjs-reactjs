import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import { DictionaryEntry } from '../../domain/entities/dictionary-entry.entity';
import {
  DICTIONARY_REPOSITORY,
  type IDictionaryRepository,
} from '../../domain/repositories/dictionary.repository';

export interface CreateDictionaryEntryInput {
  kanji?: string;
  hiragana: string;
  romaji: string;
  meanings: string[];
  jlptLevel?: number;
  isPublic?: boolean;
  creatorId?: string;
  staffAuthorId?: string;
  isStaff?: boolean;
}

export type CreateDictionaryEntryResult = Result<{ entryId: string }, string>;

@Injectable()
export class CreateDictionaryEntryUseCase {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: IDictionaryRepository,
  ) {}

  async execute(
    input: CreateDictionaryEntryInput,
  ): Promise<CreateDictionaryEntryResult> {
    const entry = DictionaryEntry.create({
      kanji: input.kanji,
      hiragana: input.hiragana,
      romaji: input.romaji,
      meanings: input.meanings,
      jlptLevel: input.jlptLevel,
      isPublic: input.isPublic,
      creatorId: input.creatorId,
      staffAuthorId: input.staffAuthorId,
      isStaff: input.isStaff,
    });

    await this.repo.save(entry);
    return { ok: true, value: { entryId: entry.id.value } };
  }
}
