import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  QUESTION_REPOSITORY,
  type IQuestionRepository,
} from '../../domain/repositories/question.repository';
import {
  Question,
  type QuestionData,
  type QuestionReferenceType,
} from '../../domain/entities/question.entity';

export interface CreateQuestionInput {
  questionData: QuestionData;
  referenceType?: QuestionReferenceType;
  referenceId?: string;
  isPublic?: boolean;
  creatorId?: string;
  staffAuthorId?: string;
  isStaff?: boolean;
}

export type CreateQuestionResult = Result<{ questionId: string }, string>;

@Injectable()
export class CreateQuestionUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly repo: IQuestionRepository,
  ) {}

  async execute(input: CreateQuestionInput): Promise<CreateQuestionResult> {
    const question = Question.create(input);
    await this.repo.save(question);
    return { ok: true, value: { questionId: question.id.value } };
  }
}
