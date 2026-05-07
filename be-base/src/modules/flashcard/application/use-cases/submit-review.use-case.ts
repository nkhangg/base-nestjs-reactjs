import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import { SrsService } from '../../domain/services/srs.service';
import {
  FLASHCARD_REPOSITORY,
  type IFlashcardRepository,
} from '../../domain/repositories/flashcard.repository';

export interface SubmitReviewInput {
  userId: string;
  flashcardId: string;
  rating: number;
}

export type SubmitReviewResult = Result<{ nextReview: Date }, string>;

@Injectable()
export class SubmitReviewUseCase {
  private readonly srs = new SrsService();

  constructor(
    @Inject(FLASHCARD_REPOSITORY)
    private readonly repo: IFlashcardRepository,
  ) {}

  async execute(input: SubmitReviewInput): Promise<SubmitReviewResult> {
    const card = await this.repo.findById(input.flashcardId);
    if (!card) return { ok: false, error: 'Flashcard not found' };
    if (card.userId !== input.userId) return { ok: false, error: 'Forbidden' };

    const { interval, easeFactor } = this.srs.calculateNextReview(
      card.interval,
      card.easeFactor,
      input.rating,
    );

    card.applyReview(interval, easeFactor);
    await this.repo.save(card);

    return { ok: true, value: { nextReview: card.nextReview } };
  }
}
