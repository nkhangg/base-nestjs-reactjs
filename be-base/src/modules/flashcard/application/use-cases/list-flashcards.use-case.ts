import { Inject, Injectable } from '@nestjs/common';
import type {
  Flashcard,
  FlashcardStatus,
} from '../../domain/entities/flashcard.entity';
import {
  FLASHCARD_REPOSITORY,
  type IFlashcardRepository,
} from '../../domain/repositories/flashcard.repository';

export interface ListFlashcardsInput {
  userId: string;
  status?: FlashcardStatus;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListFlashcardsUseCase {
  constructor(
    @Inject(FLASHCARD_REPOSITORY)
    private readonly repo: IFlashcardRepository,
  ) {}

  async execute(
    input: ListFlashcardsInput,
  ): Promise<{ data: Flashcard[]; total: number }> {
    return this.repo.listByUser(
      input.userId,
      input.status,
      input.page,
      input.pageSize,
    );
  }
}
