import { Inject, Injectable } from '@nestjs/common';
import { UseCase, Result } from '../../../../shared/application';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';

export interface LogoutInput {
  sessionId: string;
  userId: string;
}

@Injectable()
export class LogoutUseCase implements UseCase<LogoutInput, Result<void>> {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(input: LogoutInput): Promise<Result<void>> {
    const session = await this.sessionRepo.findById(input.sessionId);

    if (!session || session.userId !== input.userId) {
      return Result.fail(new Error('Session not found'));
    }

    session.revoke();
    await this.sessionRepo.save(session);

    return Result.ok(undefined);
  }
}
