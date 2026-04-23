import { Inject, Injectable } from '@nestjs/common';
import type { Admin } from '../../domain/entities/admin.entity';
import {
  ADMIN_REPOSITORY,
  type IAdminRepository,
  type FindAllOptions,
} from '../../domain/repositories/admin.repository';

export type ListAdminsInput = FindAllOptions;

export interface ListAdminsOutput {
  data: Admin[];
  total: number;
}

@Injectable()
export class ListAdminsUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly adminRepo: IAdminRepository,
  ) {}

  execute(input: ListAdminsInput = {}): Promise<ListAdminsOutput> {
    return this.adminRepo.findAll(input);
  }
}
