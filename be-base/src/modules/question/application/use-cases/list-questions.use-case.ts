import { Inject, Injectable } from '@nestjs/common';
import {
  QUESTION_REPOSITORY,
  type IQuestionRepository,
  type ListQuestionsOptions,
} from '../../domain/repositories/question.repository';
import type { Question } from '../../domain/entities/question.entity';

@Injectable()
export class ListQuestionsUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly repo: IQuestionRepository,
  ) {}

  async execute(
    opts: ListQuestionsOptions,
  ): Promise<{ data: Question[]; total: number }> {
    return this.repo.list(opts);
  }
}
