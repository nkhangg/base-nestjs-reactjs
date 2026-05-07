import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import { Organization } from '../../domain/entities/organization.entity';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '../../domain/repositories/organization.repository';

export interface CreateOrganizationInput {
  ownerId: string;
  name: string;
}

export type CreateOrganizationResult = Result<
  { organizationId: string },
  string
>;

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(
    input: CreateOrganizationInput,
  ): Promise<CreateOrganizationResult> {
    const org = Organization.create({
      name: input.name,
      ownerId: input.ownerId,
    });
    await this.orgRepo.save(org);
    return { ok: true, value: { organizationId: org.id.value } };
  }
}
