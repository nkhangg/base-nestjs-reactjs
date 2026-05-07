import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  QUESTION_REPOSITORY,
  type IQuestionRepository,
} from '../../domain/repositories/question.repository';
import type {
  QuestionData,
  QuestionReferenceType,
} from '../../domain/entities/question.entity';

export interface UpdateQuestionInput {
  id: string;
  questionData?: QuestionData;
  referenceType?: QuestionReferenceType | null;
  referenceId?: string | null;
  isPublic?: boolean;
}

export type UpdateQuestionResult = Result<void, 'NOT_FOUND'>;

@Injectable()
export class UpdateQuestionUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly repo: IQuestionRepository,
  ) {}

  async execute(input: UpdateQuestionInput): Promise<UpdateQuestionResult> {
    const question = await this.repo.findById(input.id);
    if (!question) return { ok: false, error: 'NOT_FOUND' };

    question.update({
      questionData: input.questionData,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      isPublic: input.isPublic,
    });

    await this.repo.save(question);
    return { ok: true, value: undefined };
  }
}
