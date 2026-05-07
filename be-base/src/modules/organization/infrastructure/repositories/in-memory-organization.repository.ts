import type { Organization } from '../../domain/entities/organization.entity';
import type { IOrganizationRepository } from '../../domain/repositories/organization.repository';

export class InMemoryOrganizationRepository implements IOrganizationRepository {
  private readonly store = new Map<string, Organization>();

  async findById(id: string): Promise<Organization | null> {
    return this.store.get(id) ?? null;
  }

  async findByOwner(
    ownerId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Organization[]; total: number }> {
    const results = Array.from(this.store.values())
      .filter((o) => o.ownerId === ownerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }

  async findAll(
    page: number,
    pageSize: number,
    search?: string,
  ): Promise<{ data: Organization[]; total: number }> {
    let results = Array.from(this.store.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    if (search) {
      const q = search.toLowerCase();
      results = results.filter((o) => o.name.toLowerCase().includes(q));
    }
    const total = results.length;
    const skip = (page - 1) * pageSize;
    return { data: results.slice(skip, skip + pageSize), total };
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async save(org: Organization): Promise<void> {
    this.store.set(org.id.value, org);
  }
}
