import { Inject, Injectable } from '@nestjs/common';
import type { Result } from '../../../../shared/application/result';
import type { AppConfig } from '../../domain/entities/app-config.entity';
import {
  CONFIG_REPOSITORY,
  type IConfigRepository,
} from '../../domain/repositories/config.repository';

export type GetConfigByIdResult = Result<AppConfig, string>;

@Injectable()
export class GetConfigByIdUseCase {
  constructor(
    @Inject(CONFIG_REPOSITORY) private readonly configRepo: IConfigRepository,
  ) {}

  async execute(id: string): Promise<GetConfigByIdResult> {
    const config = await this.configRepo.findById(id);
    if (!config) return { ok: false, error: 'NOT_FOUND' };
    return { ok: true, value: config };
  }
}
