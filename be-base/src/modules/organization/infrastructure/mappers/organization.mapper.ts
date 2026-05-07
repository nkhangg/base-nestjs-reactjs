import { Organization } from '../../domain/entities/organization.entity';

interface OrganizationRecord {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
}

export class OrganizationMapper {
  static toDomain(r: OrganizationRecord): Organization {
    return Organization.reconstitute(r.id, {
      name: r.name,
      ownerId: r.ownerId,
      createdAt: r.createdAt,
    });
  }
}
