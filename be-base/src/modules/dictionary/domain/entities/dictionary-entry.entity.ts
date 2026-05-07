import { BaseEntity } from '../../../../shared/domain/base-entity';
import { DictionaryEntryId } from '../value-objects/dictionary-entry-id.vo';

export type DictionaryEntryStatus = 'pending' | 'approved' | 'rejected';

export interface DictionaryEntryProps {
  kanji: string | null;
  hiragana: string;
  romaji: string;
  meanings: string[];
  jlptLevel: number | null;
  status: DictionaryEntryStatus;
  isPublic: boolean;
  creatorId: string | null;
  staffAuthorId: string | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DictionaryEntry extends BaseEntity<DictionaryEntryId> {
  private props: DictionaryEntryProps;

  private constructor(id: DictionaryEntryId, props: DictionaryEntryProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    kanji?: string;
    hiragana: string;
    romaji: string;
    meanings: string[];
    jlptLevel?: number;
    isPublic?: boolean;
    creatorId?: string;
    staffAuthorId?: string;
    isStaff?: boolean;
  }): DictionaryEntry {
    const now = new Date();
    return new DictionaryEntry(DictionaryEntryId.create(), {
      kanji: params.kanji ?? null,
      hiragana: params.hiragana,
      romaji: params.romaji,
      meanings: params.meanings,
      jlptLevel: params.jlptLevel ?? null,
      status: params.isStaff ? 'approved' : 'pending',
      isPublic: params.isPublic ?? true,
      creatorId: params.creatorId ?? null,
      staffAuthorId: params.staffAuthorId ?? null,
      verifiedBy: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(
    id: string,
    props: DictionaryEntryProps,
  ): DictionaryEntry {
    return new DictionaryEntry(DictionaryEntryId.from(id), props);
  }

  approve(adminId: string): void {
    this.props.status = 'approved';
    this.props.verifiedBy = adminId;
    this.props.updatedAt = new Date();
  }

  reject(adminId: string): void {
    this.props.status = 'rejected';
    this.props.verifiedBy = adminId;
    this.props.updatedAt = new Date();
  }

  update(params: {
    kanji?: string | null;
    hiragana?: string;
    romaji?: string;
    meanings?: string[];
    jlptLevel?: number | null;
    isPublic?: boolean;
  }): void {
    if (params.kanji !== undefined) this.props.kanji = params.kanji;
    if (params.hiragana !== undefined) this.props.hiragana = params.hiragana;
    if (params.romaji !== undefined) this.props.romaji = params.romaji;
    if (params.meanings !== undefined) this.props.meanings = params.meanings;
    if (params.jlptLevel !== undefined) this.props.jlptLevel = params.jlptLevel;
    if (params.isPublic !== undefined) this.props.isPublic = params.isPublic;
    this.props.updatedAt = new Date();
  }

  get kanji(): string | null {
    return this.props.kanji;
  }
  get hiragana(): string {
    return this.props.hiragana;
  }
  get romaji(): string {
    return this.props.romaji;
  }
  get meanings(): string[] {
    return this.props.meanings;
  }
  get jlptLevel(): number | null {
    return this.props.jlptLevel;
  }
  get status(): DictionaryEntryStatus {
    return this.props.status;
  }
  get isPublic(): boolean {
    return this.props.isPublic;
  }
  get creatorId(): string | null {
    return this.props.creatorId;
  }
  get staffAuthorId(): string | null {
    return this.props.staffAuthorId;
  }
  get verifiedBy(): string | null {
    return this.props.verifiedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
