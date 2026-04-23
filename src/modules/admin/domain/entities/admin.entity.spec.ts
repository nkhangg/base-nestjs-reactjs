import { Admin } from './admin.entity';

describe('Admin', () => {
  describe('create', () => {
    it('should create an admin with provided fields', () => {
      const admin = Admin.create({ email: 'a@test.com', passwordHash: 'hash' });

      expect(admin.email).toBe('a@test.com');
      expect(admin.passwordHash).toBe('hash');
      expect(admin.role).toBe('admin');
      expect(admin.createdAt).toBeInstanceOf(Date);
      expect(admin.id.value).toBeTruthy();
    });

    it('should use custom role when provided', () => {
      const admin = Admin.create({
        email: 'a@test.com',
        passwordHash: 'hash',
        role: 'super-admin',
      });

      expect(admin.role).toBe('super-admin');
    });

    it('should generate unique ids for each admin', () => {
      const a = Admin.create({ email: 'a@test.com', passwordHash: 'h' });
      const b = Admin.create({ email: 'b@test.com', passwordHash: 'h' });

      expect(a.id.value).not.toBe(b.id.value);
    });
  });

  describe('reconstitute', () => {
    it('should restore admin with given id and props', () => {
      const fixedId = 'fixed-id-123';
      const createdAt = new Date('2024-01-01');

      const admin = Admin.reconstitute(fixedId, {
        email: 'r@test.com',
        passwordHash: 'hashed',
        role: 'editor',
        isActive: true,
        createdAt,
      });

      expect(admin.id.value).toBe(fixedId);
      expect(admin.email).toBe('r@test.com');
      expect(admin.role).toBe('editor');
      expect(admin.isActive).toBe(true);
      expect(admin.createdAt).toBe(createdAt);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', () => {
      const admin = Admin.create({ email: 'a@test.com', passwordHash: 'h' });
      expect(admin.isActive).toBe(true);
      admin.deactivate();
      expect(admin.isActive).toBe(false);
    });
  });

  describe('updateRole', () => {
    it('should update role', () => {
      const admin = Admin.create({ email: 'a@test.com', passwordHash: 'h' });
      admin.updateRole('editor');
      expect(admin.role).toBe('editor');
    });
  });

  describe('equals', () => {
    it('should consider two admins with same id equal', () => {
      const a = Admin.reconstitute('id-1', {
        email: 'a@test.com',
        passwordHash: 'h',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
      });
      const b = Admin.reconstitute('id-1', {
        email: 'b@test.com',
        passwordHash: 'h2',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
      });

      expect(a.equals(b)).toBe(true);
    });
  });
});
