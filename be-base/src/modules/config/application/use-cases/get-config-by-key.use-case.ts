import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import type { AppConfig, ConfigScope } from '../../domain/entities/app-config.entity';
import {
  CONFIG_REPOSITORY,
  type IConfigRepository,
} from '../../domain/repositories/config.repository';
import { ConfigCacheService } from '../services/config-cache.service';

export interface GetConfigByKeyInput {
  key: string;
  allowedScopes: ConfigScope[];
}

export type GetConfigByKeyResult = Result<AppConfig, string>;

@Injectable()
export class GetConfigByKeyUseCase {
  constructor(
    @Inject(CONFIG_REPOSITORY) private readonly configRepo: IConfigRepository,
    private readonly cache: ConfigCacheService,
  ) {}

  async execute(input: GetConfigByKeyInput): Promise<GetConfigByKeyResult> {
    let config = this.cache.get(input.key);

    if (!config) {
      config = await this.configRepo.findByKey(input.key);
      if (config) this.cache.set(input.key, config);
    }

    if (!config) return { ok: false, error: 'NOT_FOUND' };
    if (!config.isEnabled) return { ok: false, error: 'NOT_FOUND' };
    if (!input.allowedScopes.includes(config.scope)) {
      return { ok: false, error: 'NOT_FOUND' };
    }

    return { ok: true, value: config };
  }
}
