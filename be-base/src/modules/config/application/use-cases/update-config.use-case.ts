import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import type { ConfigScope } from '../../domain/entities/app-config.entity';
import {
  CONFIG_REPOSITORY,
  type IConfigRepository,
} from '../../domain/repositories/config.repository';
import { ConfigCacheService } from '../services/config-cache.service';
import {
  DOMAIN_EVENT_BUS,
  type IDomainEventBus,
} from '../../../../core/events/domain/domain-event-bus.interface';
import { ConfigChangedEvent } from '../../domain/events/config-changed.event';

export interface UpdateConfigInput {
  id: string;
  value?: unknown;
  valueKeyOrder?: string[];
  description?: string | null;
  scope?: ConfigScope;
  tags?: string[];
  updatedBy?: string;
}

export type UpdateConfigResult = Result<void, string>;

@Injectable()
export class UpdateConfigUseCase {
  constructor(
    @Inject(CONFIG_REPOSITORY) private readonly configRepo: IConfigRepository,
    private readonly cache: ConfigCacheService,
    @Inject(DOMAIN_EVENT_BUS) private readonly eventBus: IDomainEventBus,
  ) {}

  async execute(input: UpdateConfigInput): Promise<UpdateConfigResult> {
    const config = await this.configRepo.findById(input.id);
    if (!config) return { ok: false, error: 'NOT_FOUND' };

    const oldValue = config.value;

    config.update({
      value: input.value,
      valueKeyOrder: input.valueKeyOrder,
      description: input.description,
      scope: input.scope,
      tags: input.tags,
      updatedBy: input.updatedBy,
    });

    await this.configRepo.save(config);
    this.cache.invalidate(config.key.value);

    if (input.value !== undefined) {
      this.eventBus.publish(
        new ConfigChangedEvent(
          config.id.value,
          config.key.value,
          oldValue,
          config.value,
          input.updatedBy,
        ),
      );
    }

    return { ok: true, value: undefined };
  }
}
