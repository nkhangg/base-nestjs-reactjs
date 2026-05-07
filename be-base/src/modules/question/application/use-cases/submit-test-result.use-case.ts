import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events';
import {
  QUESTION_REPOSITORY,
  type IQuestionRepository,
} from '../../domain/repositories/question.repository';
import { MockTestSubmittedEvent } from '../../domain/events/mock-test-submitted.event';

export interface SubmitTestResultInput {
  userId: string | null;
  answers: Array<{ questionId: string; answer: unknown }>;
}

export interface SubmitTestResultOutput {
  total: number;
  correct: number;
  xp: number;
  results: Array<{
    questionId: string;
    isCorrect: boolean;
    correctAnswer: unknown;
    explanation?: string;
  }>;
}

export type SubmitTestResultResult = Result<SubmitTestResultOutput, string>;

const XP_PER_CORRECT = 10;

@Injectable()
export class SubmitTestResultUseCase {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly repo: IQuestionRepository,
    @Inject(DOMAIN_EVENT_BUS)
    private readonly events: IDomainEventBus,
  ) {}

  async execute(input: SubmitTestResultInput): Promise<SubmitTestResultResult> {
    const results: SubmitTestResultOutput['results'] = [];
    let correct = 0;

    for (const answer of input.answers) {
      const question = await this.repo.findById(answer.questionId);
      if (!question) {
        return { ok: false, error: `QUESTION_NOT_FOUND:${answer.questionId}` };
      }

      const isCorrect = this.grade(
        question.questionData.answer,
        answer.answer,
        question.questionData.type,
      );
      if (isCorrect) correct++;

      results.push({
        questionId: answer.questionId,
        isCorrect,
        correctAnswer: question.questionData.answer,
        explanation: question.questionData.explanation,
      });
    }

    const xp = correct * XP_PER_CORRECT;

    await this.events.publish(
      new MockTestSubmittedEvent(
        input.userId,
        input.answers.length,
        correct,
        xp,
      ),
    );

    return {
      ok: true,
      value: { total: input.answers.length, correct, xp, results },
    };
  }

  private grade(
    correctAnswer: unknown,
    submittedAnswer: unknown,
    type: string,
  ): boolean {
    if (type === 'matching') {
      return JSON.stringify(correctAnswer) === JSON.stringify(submittedAnswer);
    }
    return (
      String(correctAnswer).trim().toLowerCase() ===
      String(submittedAnswer).trim().toLowerCase()
    );
  }
}
