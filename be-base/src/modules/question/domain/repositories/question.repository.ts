import type { Question, QuestionStatus } from '../entities/question.entity';

export const QUESTION_REPOSITORY = Symbol('QUESTION_REPOSITORY');

export interface ListQuestionsOptions {
  page: number;
  pageSize: number;
  status?: QuestionStatus;
  referenceType?: string;
  referenceId?: string;
  isPublic?: boolean;
  search?: string;
}

export interface IQuestionRepository {
  findById(id: string): Promise<Question | null>;
  list(
    opts: ListQuestionsOptions,
  ): Promise<{ data: Question[]; total: number }>;
  listByReference(
    referenceType: string,
    referenceId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Question[]; total: number }>;
  findApprovedPublic(count: number, jlptLevel?: number): Promise<Question[]>;
  save(question: Question): Promise<void>;
  delete(id: string): Promise<void>;
}
