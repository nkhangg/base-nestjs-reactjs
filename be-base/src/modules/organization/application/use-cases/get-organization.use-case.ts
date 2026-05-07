import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import type { Organization } from '../../domain/entities/organization.entity';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface GetOrganizationInput {
  organizationId: string;
  requesterId: string;
}

export type GetOrganizationResult = Result<Organization, string>;

@Injectable()
export class GetOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(input: GetOrganizationInput): Promise<GetOrganizationResult> {
    const org = await this.orgRepo.findById(input.organizationId);
    if (!org) return { ok: false, error: 'Organization not found' };
    if (org.ownerId !== input.requesterId)
      return { ok: false, error: 'Forbidden' };
    return { ok: true, value: org };
  }
}
