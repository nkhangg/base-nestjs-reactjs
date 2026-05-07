import { Inject, Injectable } from '@nestjs/common';
import type { Organization } from '../../domain/entities/organization.entity';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface ListOrganizationsInput {
  ownerId: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(
    input: ListOrganizationsInput,
  ): Promise<{ data: Organization[]; total: number }> {
    return this.orgRepo.findByOwner(input.ownerId, input.page, input.pageSize);
  }
}
