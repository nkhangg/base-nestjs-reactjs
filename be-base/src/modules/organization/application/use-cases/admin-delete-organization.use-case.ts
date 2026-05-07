import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../shared/application';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '../../domain/repositories/organization.repository';

export type AdminDeleteOrganizationResult = Result<void, string>;

@Injectable()
export class AdminDeleteOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async execute(id: string): Promise<AdminDeleteOrganizationResult> {
    const org = await this.orgRepo.findById(id);
    if (!org) return { ok: false, error: 'Organization not found' };
    await this.orgRepo.delete(id);
    return { ok: true, value: undefined };
  }
}
