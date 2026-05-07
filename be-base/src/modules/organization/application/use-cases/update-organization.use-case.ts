import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface UpdateOrganizationInput {
  organizationId: string;
  requesterId: string;
  name: string;
}

export type UpdateOrganizationResult = Result<void, string>;

@Injectable()
export class UpdateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(
    input: UpdateOrganizationInput,
  ): Promise<UpdateOrganizationResult> {
    const org = await this.orgRepo.findById(input.organizationId);
    if (!org) return { ok: false, error: 'Organization not found' };
    if (org.ownerId !== input.requesterId)
      return { ok: false, error: 'Forbidden' };
    org.rename(input.name);
    await this.orgRepo.save(org);
    return { ok: true, value: undefined };
  }
}
