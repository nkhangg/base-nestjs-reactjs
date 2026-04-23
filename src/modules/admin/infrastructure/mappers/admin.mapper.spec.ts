import { AdminMapper } from './admin.mapper';
import { Admin } from '../../domain/entities/admin.entity';

describe('AdminMapper', () => {
  const record = {
    id: 'map-id-1',
    email: 'mapper@test.com',
    passwordHash: 'hashed',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-06-01'),
  };

  describe('toDomain', () => {
    it('should map record to Admin entity', () => {
      const admin = AdminMapper.toDomain(record);

      expect(admin.id.value).toBe(record.id);
      expect(admin.email).toBe(record.email);
      expect(admin.passwordHash).toBe(record.passwordHash);
      expect(admin.role).toBe(record.role);
      expect(admin.createdAt).toBe(record.createdAt);
    });
  });

  describe('toRecord', () => {
    it('should map Admin entity to record', () => {
      const admin = Admin.reconstitute(record.id, {
        email: record.email,
        passwordHash: record.passwordHash,
        role: record.role,
        isActive: record.isActive,
        createdAt: record.createdAt,
      });

      const result = AdminMapper.toRecord(admin);

      expect(result).toEqual(record);
    });
  });

  describe('roundtrip', () => {
    it('toDomain → toRecord should preserve all fields', () => {
      const result = AdminMapper.toRecord(AdminMapper.toDomain(record));
      expect(result).toEqual(record);
    });
  });
});
