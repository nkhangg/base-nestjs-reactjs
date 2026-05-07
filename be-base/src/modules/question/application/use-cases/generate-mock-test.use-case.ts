import { Inject, Injectable } from '@nestjs/common';
import {
  QUESTION_REPOSITORY,
  type IQuestionRepository,
} from '../../domain/repositories/question.repository';
import type { Question } from '../../domain/entities/question.entity';

export interface GenerateMockTestInput {
  count: number;
  jlptLevel?: number;
}

@Injectable()
export class GenerateMockTestUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly repo: IQuestionRepository,
  ) {}

  async execute(
    input: GenerateMockTestInput,
  ): Promise<{ questions: Question[] }> {
    const questions = await this.repo.findApprovedPublic(
      input.count,
      input.jlptLevel,
    );
    return { questions };
  }
}
