import { Module } from '@nestjs/common';
import type { ClassProvider } from '@nestjs/common';
import { FLASHCARD_REPOSITORY } from './domain/repositories/flashcard.repository';
import { PrismaFlashcardRepository } from './infrastructure/repositories/prisma-flashcard.repository';
import { AddFlashcardUseCase } from './application/use-cases/add-flashcard.use-case';
import { GetReviewSessionUseCase } from './application/use-cases/get-review-session.use-case';
import { SubmitReviewUseCase } from './application/use-cases/submit-review.use-case';
import { ListFlashcardsUseCase } from './application/use-cases/list-flashcards.use-case';
import { DeleteFlashcardUseCase } from './application/use-cases/delete-flashcard.use-case';
import { FlashcardController } from './presentation/flashcard.controller';

@Module({
  controllers: [FlashcardController],
  providers: [
    {
      provide: FLASHCARD_REPOSITORY,
      useClass: PrismaFlashcardRepository,
    } as ClassProvider,
    AddFlashcardUseCase,
    GetReviewSessionUseCase,
    SubmitReviewUseCase,
    ListFlashcardsUseCase,
    DeleteFlashcardUseCase,
  ],
})
export class FlashcardModule {}
