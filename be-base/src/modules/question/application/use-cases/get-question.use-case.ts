import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  QUESTION_REPOSITORY,
  type IQuestionRepository,
} from '../../domain/repositories/question.repository';
import type { Question } from '../../domain/entities/question.entity';

export type GetQuestionResult = Result<Question, 'NOT_FOUND'>;

@Injectable()
export class GetQuestionUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly repo: IQuestionRepository,
  ) {}

  async execute(id: string): Promise<GetQuestionResult> {
    const question = await this.repo.findById(id);
    if (!question) return { ok: false, error: 'NOT_FOUND' };
    return { ok: true, value: question };
  }
}
