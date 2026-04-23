import { Session } from '../entities/session.entity';

export interface SessionRepository {
  findById(id: string): Promise<Session | null>;
  findByUserId(userId: string, onlyActive?: boolean): Promise<Session[]>;
  save(session: Session): Promise<void>;
}

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
