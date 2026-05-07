import type { Flashcard, FlashcardStatus } from '../entities/flashcard.entity';

export const FLASHCARD_REPOSITORY = Symbol('FLASHCARD_REPOSITORY');

export interface IFlashcardRepository {
  findById(id: string): Promise<Flashcard | null>;
  findByUserAndEntry(
    userId: string,
    dictionaryEntryId: string,
  ): Promise<Flashcard | null>;
  findDueCards(userId: string, limit: number): Promise<Flashcard[]>;
  listByUser(
    userId: string,
    status: FlashcardStatus | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ data: Flashcard[]; total: number }>;
  save(flashcard: Flashcard): Promise<void>;
  delete(id: string): Promise<void>;
}
