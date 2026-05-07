import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  DICTIONARY_REPOSITORY,
  type IDictionaryRepository,
} from '../../domain/repositories/dictionary.repository';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events';
import { DictionaryEntryApprovedEvent } from '../../domain/events/dictionary-entry-approved.event';

export interface ModerateDictionaryEntryInput {
  id: string;
  action: 'approve' | 'reject';
  adminId: string;
}

export type ModerateDictionaryEntryResult = Result<void, string>;

@Injectable()
export class ModerateDictionaryEntryUseCase {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: IDictionaryRepository,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(
    input: ModerateDictionaryEntryInput,
  ): Promise<ModerateDictionaryEntryResult> {
    const entry = await this.repo.findById(input.id);
    if (!entry) return { ok: false, error: 'NOT_FOUND' };

    if (input.action === 'approve') {
      entry.approve(input.adminId);
      await this.repo.save(entry);
      this.eventBus.publish(
        new DictionaryEntryApprovedEvent(
          entry.id.value,
          entry.hiragana,
          input.adminId,
        ),
      );
    } else {
      entry.reject(input.adminId);
      await this.repo.save(entry);
    }

    return { ok: true, value: undefined };
  }
}
