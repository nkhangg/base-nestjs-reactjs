import { Injectable } from '@nestjs/common';
import { Session } from '../../domain/entities/session.entity';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionMapper, SessionRecord } from '../mappers/session.mapper';

@Injectable()
export class InMemorySessionRepository implements SessionRepository {
  private store = new Map<string, SessionRecord>();

  findById(id: string): Promise<Session | null> {
    const r = this.store.get(id);
    return Promise.resolve(r ? SessionMapper.toDomain(r) : null);
  }

  findByUserId(userId: string, onlyActive?: boolean): Promise<Session[]> {
    const result = [...this.store.values()]
      .filter((r) => r.userId === userId && (onlyActive === undefined || r.isActive === onlyActive))
      .map((r) => SessionMapper.toDomain(r));
    return Promise.resolve(result);
  }

  save(session: Session): Promise<void> {
    this.store.set(session.id, SessionMapper.toPrisma(session));
    return Promise.resolve();
  }
}
