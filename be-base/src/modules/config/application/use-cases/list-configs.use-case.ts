import { Inject, Injectable } from '@nestjs/common';
import type { AppConfig, ConfigScope } from '../../domain/entities/app-config.entity';
import {
  CONFIG_REPOSITORY,
  type FindAllConfigsOptions,
  type IConfigRepository,
} from '../../domain/repositories/config.repository';

export interface ListConfigsInput extends FindAllConfigsOptions {}

export interface ListConfigsResult {
  data: AppConfig[];
  total: number;
}

@Injectable()
export class ListConfigsUseCase {
  constructor(
    @Inject(CONFIG_REPOSITORY) private readonly configRepo: IConfigRepository,
  ) {}

  async execute(input: ListConfigsInput = {}): Promise<ListConfigsResult> {
    return this.configRepo.findAll(input);
  }
}
