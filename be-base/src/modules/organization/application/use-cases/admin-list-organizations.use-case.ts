import { Inject, Injectable } from '@nestjs/common';
import type { Organization } from '../../domain/entities/organization.entity';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface AdminListOrganizationsInput {
  page: number;
  pageSize: number;
  search?: string;
}

@Injectable()
export class AdminListOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(
    input: AdminListOrganizationsInput,
  ): Promise<{ data: Organization[]; total: number }> {
    return this.orgRepo.findAll(input.page, input.pageSize, input.search);
  }
}
