import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import { AppConfig, type ConfigScope } from '../../domain/entities/app-config.entity';
import {
  CONFIG_REPOSITORY,
  type IConfigRepository,
} from '../../domain/repositories/config.repository';

export interface CreateConfigInput {
  key: string;
  value: unknown;
  description?: string;
  scope?: ConfigScope;
  tags?: string[];
  createdBy?: string;
}

export type CreateConfigResult = Result<{ configId: string }, string>;

@Injectable()
export class CreateConfigUseCase {
  constructor(
    @Inject(CONFIG_REPOSITORY) private readonly configRepo: IConfigRepository,
  ) {}

  async execute(input: CreateConfigInput): Promise<CreateConfigResult> {
    const exists = await this.configRepo.existsByKey(input.key);
    if (exists) return { ok: false, error: 'KEY_ALREADY_EXISTS' };

    let config: AppConfig;
    try {
      config = AppConfig.create({
        key: input.key,
        value: input.value,
        description: input.description,
        scope: input.scope,
        tags: input.tags,
        createdBy: input.createdBy,
      });
    } catch (e: unknown) {
      return { ok: false, error: (e as Error).message };
    }

    await this.configRepo.save(config);
    return { ok: true, value: { configId: config.id.value } };
  }
}
