import { Inject, Injectable } from '@nestjs/common';
import type { AppConfig, ConfigScope } from '../../domain/entities/app-config.entity';
import {
  CONFIG_REPOSITORY,
  type IConfigRepository,
} from '../../domain/repositories/config.repository';
import { ConfigCacheService } from '../services/config-cache.service';

export interface GetConfigsBatchInput {
  keys: string[];
  allowedScopes: ConfigScope[];
}

@Injectable()
export class GetConfigsBatchUseCase {
  constructor(
    @Inject(CONFIG_REPOSITORY) private readonly configRepo: IConfigRepository,
    private readonly cache: ConfigCacheService,
  ) {}

  async execute(input: GetConfigsBatchInput): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    const missedKeys: string[] = [];

    for (const key of input.keys) {
      const cached = this.cache.get(key);
      if (cached) {
        if (cached.isEnabled && input.allowedScopes.includes(cached.scope)) {
          result[key] = cached.value;
        }
      } else {
        missedKeys.push(key);
      }
    }

    if (missedKeys.length > 0) {
      const configs = await this.configRepo.findByKeys(missedKeys);
      for (const config of configs) {
        this.cache.set(config.key.value, config);
        if (config.isEnabled && input.allowedScopes.includes(config.scope)) {
          result[config.key.value] = config.value;
        }
      }
    }

    return result;
  }
}
