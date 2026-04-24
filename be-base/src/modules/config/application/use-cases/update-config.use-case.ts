import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import type { ConfigScope } from '../../domain/entities/app-config.entity';
import {
  CONFIG_REPOSITORY,
  type IConfigRepository,
} from '../../domain/repositories/config.repository';
import { ConfigCacheService } from '../services/config-cache.service';

export interface UpdateConfigInput {
  id: string;
  value?: unknown;
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
  ) {}

  async execute(input: UpdateConfigInput): Promise<UpdateConfigResult> {
    const config = await this.configRepo.findById(input.id);
    if (!config) return { ok: false, error: 'NOT_FOUND' };

    config.update({
      value: input.value,
      description: input.description,
      scope: input.scope,
      tags: input.tags,
      updatedBy: input.updatedBy,
    });

    await this.configRepo.save(config);
    this.cache.invalidate(config.key.value);

    return { ok: true, value: undefined };
  }
}
