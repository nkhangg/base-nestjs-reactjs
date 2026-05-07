import type {
  Flashcard,
  FlashcardStatus,
} from '../../domain/entities/flashcard.entity';
import type { IFlashcardRepository } from '../../domain/repositories/flashcard.repository';

export class InMemoryFlashcardRepository implements IFlashcardRepository {
  private readonly store = new Map<string, Flashcard>();

  async findById(id: string): Promise<Flashcard | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserAndEntry(
    userId: string,
    dictionaryEntryId: string,
  ): Promise<Flashcard | null> {
    for (const card of this.store.values()) {
      if (
        card.userId === userId &&
        card.dictionaryEntryId === dictionaryEntryId
      ) {
        return card;
      }
    }
    return null;
  }

  async findDueCards(userId: string, limit: number): Promise<Flashcard[]> {
    const now = new Date();
    return Array.from(this.store.values())
      .filter(
        (c) =>
          c.userId === userId && c.status !== 'mastered' && c.nextReview <= now,
      )
      .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime())
      .slice(0, limit);
  }

  async listByUser(
    userId: string,
    status: FlashcardStatus | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ data: Flashcard[]; total: number }> {
    let results = Array.from(this.store.values()).filter(
      (c) => c.userId === userId,
    );

    if (status !== undefined) {
      results = results.filter((c) => c.status === status);
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }

  async save(flashcard: Flashcard): Promise<void> {
    this.store.set(flashcard.id.value, flashcard);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
