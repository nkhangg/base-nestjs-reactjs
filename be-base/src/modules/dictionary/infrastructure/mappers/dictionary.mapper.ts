import {
  DictionaryEntry,
  type DictionaryEntryStatus,
} from '../../domain/entities/dictionary-entry.entity';

interface DictionaryEntryRecord {
  id: string;
  kanji: string | null;
  hiragana: string;
  romaji: string;
  meanings: unknown;
  jlptLevel: number | null;
  status: string;
  isPublic: boolean;
  creatorId: string | null;
  staffAuthorId: string | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DictionaryMapper {
  static toDomain(r: DictionaryEntryRecord): DictionaryEntry {
    const meanings = Array.isArray(r.meanings)
      ? (r.meanings as string[])
      : (r.meanings as unknown as string[]);

    return DictionaryEntry.reconstitute(r.id, {
      kanji: r.kanji,
      hiragana: r.hiragana,
      romaji: r.romaji,
      meanings,
      jlptLevel: r.jlptLevel,
      status: r.status as DictionaryEntryStatus,
      isPublic: r.isPublic,
      creatorId: r.creatorId,
      staffAuthorId: r.staffAuthorId,
      verifiedBy: r.verifiedBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }
}
