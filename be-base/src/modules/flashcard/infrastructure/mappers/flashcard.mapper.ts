import {
  Flashcard,
  type FlashcardStatus,
} from '../../domain/entities/flashcard.entity';

interface FlashcardRecord {
  id: string;
  userId: string;
  dictionaryEntryId: string;
  interval: number;
  easeFactor: number;
  nextReview: Date;
  status: string;
  lastReviewedAt: Date | null;
  createdAt: Date;
}

export class FlashcardMapper {
  static toDomain(r: FlashcardRecord): Flashcard {
    return Flashcard.reconstitute(r.id, {
      userId: r.userId,
      dictionaryEntryId: r.dictionaryEntryId,
      interval: r.interval,
      easeFactor: r.easeFactor,
      nextReview: r.nextReview,
      status: r.status as FlashcardStatus,
      lastReviewedAt: r.lastReviewedAt,
      createdAt: r.createdAt,
    });
  }
}
