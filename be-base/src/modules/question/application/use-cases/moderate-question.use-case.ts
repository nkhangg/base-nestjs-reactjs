import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  QUESTION_REPOSITORY,
  type IQuestionRepository,
} from '../../domain/repositories/question.repository';

export interface ModerateQuestionInput {
  id: string;
  action: 'approve' | 'reject';
  adminId: string;
}

export type ModerateQuestionResult = Result<void, 'NOT_FOUND'>;

@Injectable()
export class ModerateQuestionUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly repo: IQuestionRepository,
  ) {}

  async execute(input: ModerateQuestionInput): Promise<ModerateQuestionResult> {
    const question = await this.repo.findById(input.id);
    if (!question) return { ok: false, error: 'NOT_FOUND' };

    if (input.action === 'approve') {
      question.approve(input.adminId);
    } else {
      question.reject(input.adminId);
    }

    await this.repo.save(question);
    return { ok: true, value: undefined };
  }
}
