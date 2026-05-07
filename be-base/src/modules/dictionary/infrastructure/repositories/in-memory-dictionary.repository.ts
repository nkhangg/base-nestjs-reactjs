import type {
  DictionaryEntry,
  DictionaryEntryStatus,
} from '../../domain/entities/dictionary-entry.entity';
import type {
  IDictionaryRepository,
  SearchDictionaryOptions,
} from '../../domain/repositories/dictionary.repository';

export class InMemoryDictionaryRepository implements IDictionaryRepository {
  private readonly store = new Map<string, DictionaryEntry>();

  async findById(id: string): Promise<DictionaryEntry | null> {
    return this.store.get(id) ?? null;
  }

  async search(
    opts: SearchDictionaryOptions,
  ): Promise<{ data: DictionaryEntry[]; total: number }> {
    let results = Array.from(this.store.values()).filter(
      (e) => e.status === 'approved' && e.isPublic,
    );

    if (opts.query) {
      const q = opts.query.toLowerCase();
      results = results.filter(
        (e) =>
          e.hiragana.toLowerCase().includes(q) ||
          e.romaji.toLowerCase().includes(q) ||
          (e.kanji?.toLowerCase().includes(q) ?? false) ||
          e.meanings.some((m) => m.toLowerCase().includes(q)),
      );
    }

    if (opts.jlptLevel !== undefined) {
      results = results.filter((e) => e.jlptLevel === opts.jlptLevel);
    }

    results.sort((a, b) => a.hiragana.localeCompare(b.hiragana));

    const total = results.length;
    const skip = (opts.page - 1) * opts.pageSize;
    return { data: results.slice(skip, skip + opts.pageSize), total };
  }

  async findByStatus(
    status: DictionaryEntryStatus,
    page: number,
    pageSize: number,
  ): Promise<{ data: DictionaryEntry[]; total: number }> {
    const results = Array.from(this.store.values())
      .filter((e) => e.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }

  async save(entry: DictionaryEntry): Promise<void> {
    this.store.set(entry.id.value, entry);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
