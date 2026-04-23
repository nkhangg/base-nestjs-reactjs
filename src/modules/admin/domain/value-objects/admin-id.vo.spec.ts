import { AdminId } from './admin-id.vo';

describe('AdminId', () => {
  describe('create', () => {
    it('should generate a valid UUID', () => {
      const id = AdminId.create();
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique values each time', () => {
      const a = AdminId.create();
      const b = AdminId.create();
      expect(a.value).not.toBe(b.value);
    });
  });

  describe('from', () => {
    it('should wrap an existing string', () => {
      const raw = 'abc-123';
      expect(AdminId.from(raw).value).toBe(raw);
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = AdminId.from('same-id');
      const b = AdminId.from('same-id');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = AdminId.from('id-1');
      const b = AdminId.from('id-2');
      expect(a.equals(b)).toBe(false);
    });
  });
});
