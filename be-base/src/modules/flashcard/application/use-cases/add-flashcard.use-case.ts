import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import { Flashcard } from '../../domain/entities/flashcard.entity';
import {
  FLASHCARD_REPOSITORY,
  type IFlashcardRepository,
} from '../../domain/repositories/flashcard.repository';

export interface AddFlashcardInput {
  userId: string;
  dictionaryEntryId: string;
}

export type AddFlashcardResult = Result<{ flashcardId: string }, string>;

@Injectable()
export class AddFlashcardUseCase {
  constructor(
    @Inject(FLASHCARD_REPOSITORY)
    private readonly repo: IFlashcardRepository,
  ) {}

  async execute(input: AddFlashcardInput): Promise<AddFlashcardResult> {
    const existing = await this.repo.findByUserAndEntry(
      input.userId,
      input.dictionaryEntryId,
    );
    if (existing) {
      return { ok: false, error: 'Flashcard already exists for this entry' };
    }

    const card = Flashcard.create({
      userId: input.userId,
      dictionaryEntryId: input.dictionaryEntryId,
    });

    await this.repo.save(card);
    return { ok: true, value: { flashcardId: card.id.value } };
  }
}
