import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  QUESTION_REPOSITORY,
  type IQuestionRepository,
} from '../../domain/repositories/question.repository';

export type DeleteQuestionResult = Result<void, 'NOT_FOUND'>;

@Injectable()
export class DeleteQuestionUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly repo: IQuestionRepository,
  ) {}

  async execute(id: string): Promise<DeleteQuestionResult> {
    const question = await this.repo.findById(id);
    if (!question) return { ok: false, error: 'NOT_FOUND' };
    await this.repo.delete(id);
    return { ok: true, value: undefined };
  }
}
