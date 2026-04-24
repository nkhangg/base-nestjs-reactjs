import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import {
  CONFIG_REPOSITORY,
  type IConfigRepository,
} from '../../domain/repositories/config.repository';
import { ConfigCacheService } from '../services/config-cache.service';

export type DeleteConfigResult = Result<void, string>;

@Injectable()
export class DeleteConfigUseCase {
  constructor(
    @Inject(CONFIG_REPOSITORY) private readonly configRepo: IConfigRepository,
    private readonly cache: ConfigCacheService,
  ) {}

  async execute(id: string): Promise<DeleteConfigResult> {
    const config = await this.configRepo.findById(id);
    if (!config) return { ok: false, error: 'NOT_FOUND' };

    const key = config.key.value;
    await this.configRepo.delete(id);
    this.cache.invalidate(key);

    return { ok: true, value: undefined };
  }
}
