import { InMemoryAdminRepository } from './in-memory-admin.repository';
import { Admin } from '../../domain/entities/admin.entity';

const makeAdmin = (overrides: Partial<{ email: string; role: string }> = {}) =>
  Admin.create({
    email: overrides.email ?? 'admin@test.com',
    passwordHash: 'hashed',
    role: overrides.role,
  });

describe('InMemoryAdminRepository', () => {
  let repo: InMemoryAdminRepository;

  beforeEach(() => {
    repo = new InMemoryAdminRepository();
  });

  describe('save + findById', () => {
    it('should persist and retrieve admin by id', async () => {
      const admin = makeAdmin();
      await repo.save(admin);

      const found = await repo.findById(admin.id.value);
      expect(found).not.toBeNull();
      expect(found!.id.value).toBe(admin.id.value);
    });

    it('should return null for unknown id', async () => {
      const found = await repo.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('save + findByEmail', () => {
    it('should persist and retrieve admin by email', async () => {
      const admin = makeAdmin({ email: 'find@test.com' });
      await repo.save(admin);

      const found = await repo.findByEmail('find@test.com');
      expect(found).not.toBeNull();
      expect(found!.email).toBe('find@test.com');
    });

    it('should return null for unknown email', async () => {
      const found = await repo.findByEmail('nobody@test.com');
      expect(found).toBeNull();
    });
  });

  describe('save (update)', () => {
    it('should overwrite existing admin on second save', async () => {
      const admin = makeAdmin({ email: 'before@test.com' });
      await repo.save(admin);

      const updated = Admin.reconstitute(admin.id.value, {
        email: 'after@test.com',
        passwordHash: 'new-hash',
        role: 'super-admin',
        isActive: true,
        createdAt: admin.createdAt,
      });
      await repo.save(updated);

      const found = await repo.findById(admin.id.value);
      expect(found!.email).toBe('after@test.com');
      expect(found!.role).toBe('super-admin');
    });
  });

  describe('findAll', () => {
    it('should return all admins with total', async () => {
      await repo.save(makeAdmin({ email: 'a@test.com' }));
      await repo.save(makeAdmin({ email: 'b@test.com' }));

      const { data, total } = await repo.findAll();
      expect(data).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should filter by isActive', async () => {
      const active = makeAdmin({ email: 'active@test.com' });
      const inactive = makeAdmin({ email: 'inactive@test.com' });
      inactive.deactivate();

      await repo.save(active);
      await repo.save(inactive);

      const { data, total } = await repo.findAll({ isActive: true });
      expect(data).toHaveLength(1);
      expect(total).toBe(1);
      expect(data[0].email).toBe('active@test.com');
    });

    it('should filter by search (email)', async () => {
      await repo.save(makeAdmin({ email: 'alice@test.com' }));
      await repo.save(makeAdmin({ email: 'bob@test.com' }));

      const { data, total } = await repo.findAll({ search: 'alice' });
      expect(data).toHaveLength(1);
      expect(total).toBe(1);
      expect(data[0].email).toBe('alice@test.com');
    });

    it('should filter by role', async () => {
      await repo.save(makeAdmin({ email: 'a@test.com', role: 'editor' }));
      await repo.save(makeAdmin({ email: 'b@test.com', role: 'admin' }));

      const { data, total } = await repo.findAll({ role: 'editor' });
      expect(data).toHaveLength(1);
      expect(total).toBe(1);
    });

    it('should paginate results', async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.save(makeAdmin({ email: `user${i}@test.com` }));
      }

      const { data, total } = await repo.findAll({ page: 1, pageSize: 2 });
      expect(data).toHaveLength(2);
      expect(total).toBe(5);
    });

    it('should return empty when no admins', async () => {
      const { data, total } = await repo.findAll();
      expect(data).toHaveLength(0);
      expect(total).toBe(0);
    });
  });
});
