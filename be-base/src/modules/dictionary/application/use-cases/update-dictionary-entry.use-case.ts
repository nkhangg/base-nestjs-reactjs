import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  DICTIONARY_REPOSITORY,
  type IDictionaryRepository,
} from '../../domain/repositories/dictionary.repository';

export interface UpdateDictionaryEntryInput {
  id: string;
  kanji?: string | null;
  hiragana?: string;
  romaji?: string;
  meanings?: string[];
  jlptLevel?: number | null;
  isPublic?: boolean;
}

export type UpdateDictionaryEntryResult = Result<void, string>;

@Injectable()
export class UpdateDictionaryEntryUseCase {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: IDictionaryRepository,
  ) {}

  async execute(
    input: UpdateDictionaryEntryInput,
  ): Promise<UpdateDictionaryEntryResult> {
    const entry = await this.repo.findById(input.id);
    if (!entry) return { ok: false, error: 'NOT_FOUND' };

    entry.update({
      kanji: input.kanji,
      hiragana: input.hiragana,
      romaji: input.romaji,
      meanings: input.meanings,
      jlptLevel: input.jlptLevel,
      isPublic: input.isPublic,
    });

    await this.repo.save(entry);
    return { ok: true, value: undefined };
  }
}
