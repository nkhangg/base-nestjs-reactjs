import { BaseEntity } from '../../../../shared/domain/base-entity';
import { QuestionId } from '../value-objects/question-id.vo';

export type QuestionStatus = 'pending' | 'approved' | 'rejected';
export type QuestionReferenceType = 'article' | 'dictionary' | 'none';
export type QuestionType = 'quiz' | 'fill_in_blank' | 'matching';

export interface QuestionData {
  type: QuestionType;
  prompt: string;
  choices?: string[];
  answer: unknown;
  explanation?: string;
  jlptLevel?: number;
}

export interface QuestionProps {
  questionData: QuestionData;
  referenceType: QuestionReferenceType | null;
  referenceId: string | null;
  status: QuestionStatus;
  isPublic: boolean;
  creatorId: string | null;
  staffAuthorId: string | null;
  verifiedBy: string | null;
  createdAt: Date;
}

export class Question extends BaseEntity<QuestionId> {
  private props: QuestionProps;

  private constructor(id: QuestionId, props: QuestionProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    questionData: QuestionData;
    referenceType?: QuestionReferenceType;
    referenceId?: string;
    isPublic?: boolean;
    creatorId?: string;
    staffAuthorId?: string;
    isStaff?: boolean;
  }): Question {
    return new Question(QuestionId.create(), {
      questionData: params.questionData,
      referenceType: params.referenceType ?? null,
      referenceId: params.referenceId ?? null,
      status: params.isStaff ? 'approved' : 'pending',
      isPublic: params.isPublic ?? true,
      creatorId: params.creatorId ?? null,
      staffAuthorId: params.staffAuthorId ?? null,
      verifiedBy: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: QuestionProps): Question {
    return new Question(QuestionId.from(id), props);
  }

  approve(adminId: string): void {
    this.props.status = 'approved';
    this.props.verifiedBy = adminId;
  }

  reject(adminId: string): void {
    this.props.status = 'rejected';
    this.props.verifiedBy = adminId;
  }

  update(params: {
    questionData?: QuestionData;
    referenceType?: QuestionReferenceType | null;
    referenceId?: string | null;
    isPublic?: boolean;
  }): void {
    if (params.questionData !== undefined)
      this.props.questionData = params.questionData;
    if (params.referenceType !== undefined)
      this.props.referenceType = params.referenceType;
    if (params.referenceId !== undefined)
      this.props.referenceId = params.referenceId;
    if (params.isPublic !== undefined) this.props.isPublic = params.isPublic;
  }

  get questionData(): QuestionData {
    return this.props.questionData;
  }
  get referenceType(): QuestionReferenceType | null {
    return this.props.referenceType;
  }
  get referenceId(): string | null {
    return this.props.referenceId;
  }
  get status(): QuestionStatus {
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
}
