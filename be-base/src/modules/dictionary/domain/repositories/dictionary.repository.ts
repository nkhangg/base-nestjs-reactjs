import type {
  DictionaryEntry,
  DictionaryEntryStatus,
} from '../entities/dictionary-entry.entity';

export const DICTIONARY_REPOSITORY = Symbol('DICTIONARY_REPOSITORY');

export interface SearchDictionaryOptions {
  query?: string;
  jlptLevel?: number;
  page: number;
  pageSize: number;
}

export interface IDictionaryRepository {
  findById(id: string): Promise<DictionaryEntry | null>;
  search(
    opts: SearchDictionaryOptions,
  ): Promise<{ data: DictionaryEntry[]; total: number }>;
  findByStatus(
    status: DictionaryEntryStatus,
    page: number,
    pageSize: number,
  ): Promise<{ data: DictionaryEntry[]; total: number }>;
  save(entry: DictionaryEntry): Promise<void>;
  delete(id: string): Promise<void>;
}
