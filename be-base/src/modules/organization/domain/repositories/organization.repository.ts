import type { Organization } from '../entities/organization.entity';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findByOwner(
    ownerId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Organization[]; total: number }>;
  findAll(
    page: number,
    pageSize: number,
    search?: string,
  ): Promise<{ data: Organization[]; total: number }>;
  save(org: Organization): Promise<void>;
  delete(id: string): Promise<void>;
}
