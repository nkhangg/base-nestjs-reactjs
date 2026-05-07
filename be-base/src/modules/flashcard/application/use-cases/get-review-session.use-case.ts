import { Inject, Injectable } from '@nestjs/common';
import type { Flashcard } from '../../domain/entities/flashcard.entity';
import {
  FLASHCARD_REPOSITORY,
  type IFlashcardRepository,
} from '../../domain/repositories/flashcard.repository';

const DEFAULT_SESSION_LIMIT = 20;

export interface GetReviewSessionInput {
  userId: string;
  limit?: number;
}

@Injectable()
export class GetReviewSessionUseCase {
  constructor(
    @Inject(FLASHCARD_REPOSITORY)
    private readonly repo: IFlashcardRepository,
  ) {}

  async execute(input: GetReviewSessionInput): Promise<Flashcard[]> {
    return this.repo.findDueCards(
      input.userId,
      input.limit ?? DEFAULT_SESSION_LIMIT,
    );
  }
}
