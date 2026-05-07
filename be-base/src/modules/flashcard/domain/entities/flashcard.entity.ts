import { BaseEntity } from '../../../../shared/domain/base-entity';
import { FlashcardId } from '../value-objects/flashcard-id.vo';

export type FlashcardStatus = 'new' | 'learning' | 'mastered';

export interface FlashcardProps {
  userId: string;
  dictionaryEntryId: string;
  interval: number;
  easeFactor: number;
  nextReview: Date;
  status: FlashcardStatus;
  lastReviewedAt: Date | null;
  createdAt: Date;
}

export class Flashcard extends BaseEntity<FlashcardId> {
  private props: FlashcardProps;

  private constructor(id: FlashcardId, props: FlashcardProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    userId: string;
    dictionaryEntryId: string;
  }): Flashcard {
    const now = new Date();
    return new Flashcard(FlashcardId.create(), {
      userId: params.userId,
      dictionaryEntryId: params.dictionaryEntryId,
      interval: 0,
      easeFactor: 2.5,
      nextReview: now,
      status: 'new',
      lastReviewedAt: null,
      createdAt: now,
    });
  }

  static reconstitute(id: string, props: FlashcardProps): Flashcard {
    return new Flashcard(FlashcardId.from(id), props);
  }

  applyReview(nextInterval: number, nextEaseFactor: number): void {
    const now = new Date();
    this.props.interval = nextInterval;
    this.props.easeFactor = nextEaseFactor;
    this.props.lastReviewedAt = now;

    const next = new Date(now);
    next.setDate(next.getDate() + nextInterval);
    this.props.nextReview = next;

    if (nextInterval >= 21) {
      this.props.status = 'mastered';
    } else if (nextInterval > 0) {
      this.props.status = 'learning';
    } else {
      this.props.status = 'new';
    }
  }

  get userId(): string {
    return this.props.userId;
  }
  get dictionaryEntryId(): string {
    return this.props.dictionaryEntryId;
  }
  get interval(): number {
    return this.props.interval;
  }
  get easeFactor(): number {
    return this.props.easeFactor;
  }
  get nextReview(): Date {
    return this.props.nextReview;
  }
  get status(): FlashcardStatus {
    return this.props.status;
  }
  get lastReviewedAt(): Date | null {
    return this.props.lastReviewedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
