import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  CONFIG_REPOSITORY,
  type IConfigRepository,
} from '../../domain/repositories/config.repository';
import { ConfigCacheService } from '../services/config-cache.service';

export type ToggleConfigResult = Result<{ isEnabled: boolean }, string>;

@Injectable()
export class ToggleConfigUseCase {
  constructor(
    @Inject(CONFIG_REPOSITORY) private readonly configRepo: IConfigRepository,
    private readonly cache: ConfigCacheService,
  ) {}

  async execute(id: string): Promise<ToggleConfigResult> {
    const config = await this.configRepo.findById(id);
    if (!config) return { ok: false, error: 'NOT_FOUND' };

    config.toggle();
    await this.configRepo.save(config);
    this.cache.invalidate(config.key.value);

    return { ok: true, value: { isEnabled: config.isEnabled } };
  }
}
