import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  FLASHCARD_REPOSITORY,
  type IFlashcardRepository,
} from '../../domain/repositories/flashcard.repository';

export interface DeleteFlashcardInput {
  userId: string;
  flashcardId: string;
}

export type DeleteFlashcardResult = Result<void, string>;

@Injectable()
export class DeleteFlashcardUseCase {
  constructor(
    @Inject(FLASHCARD_REPOSITORY)
    private readonly repo: IFlashcardRepository,
  ) {}

  async execute(input: DeleteFlashcardInput): Promise<DeleteFlashcardResult> {
    const card = await this.repo.findById(input.flashcardId);
    if (!card) return { ok: false, error: 'Flashcard not found' };
    if (card.userId !== input.userId) return { ok: false, error: 'Forbidden' };

    await this.repo.delete(input.flashcardId);
    return { ok: true, value: undefined };
  }
}
