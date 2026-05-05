import { MediaFolder } from './media-folder.entity';

describe('MediaFolder', () => {
  describe('create', () => {
    it('generates a unique id and timestamps', () => {
      const f = MediaFolder.create({ name: 'Photos' });
      expect(f.id.value).toBeTruthy();
      expect(f.createdAt).toBeInstanceOf(Date);
    });

    it('defaults parentId and createdBy to null', () => {
      const f = MediaFolder.create({ name: 'Photos' });
      expect(f.parentId).toBeNull();
      expect(f.createdBy).toBeNull();
    });

    it('stores parentId and createdBy when provided', () => {
      const f = MediaFolder.create({
        name: 'Sub',
        parentId: 'p-1',
        createdBy: 'admin-1',
      });
      expect(f.parentId).toBe('p-1');
      expect(f.createdBy).toBe('admin-1');
    });

    it('generates unique ids', () => {
      const a = MediaFolder.create({ name: 'A' });
      const b = MediaFolder.create({ name: 'B' });
      expect(a.id.value).not.toBe(b.id.value);
    });
  });

  describe('reconstitute', () => {
    it('restores all fields with given id', () => {
      const now = new Date('2026-01-01');
      const f = MediaFolder.reconstitute('fixed-id', {
        name: 'Docs',
        parentId: 'parent-id',
        createdBy: null,
        createdAt: now,
        updatedAt: now,
      });
      expect(f.id.value).toBe('fixed-id');
      expect(f.name).toBe('Docs');
      expect(f.parentId).toBe('parent-id');
    });
  });

  describe('rename', () => {
    it('updates name', () => {
      const f = MediaFolder.create({ name: 'Old' });
      f.rename('New');
      expect(f.name).toBe('New');
    });

    it('updates updatedAt', () => {
      const f = MediaFolder.create({ name: 'Old' });
      const before = f.updatedAt;
      jest.useFakeTimers();
      jest.advanceTimersByTime(50);
      f.rename('New');
      expect(f.updatedAt.getTime()).toBeGreaterThan(before.getTime());
      jest.useRealTimers();
    });
  });

  describe('move', () => {
    it('updates parentId', () => {
      const f = MediaFolder.create({ name: 'F', parentId: 'old-parent' });
      f.move('new-parent');
      expect(f.parentId).toBe('new-parent');
    });

    it('moves to root (null)', () => {
      const f = MediaFolder.create({ name: 'F', parentId: 'some-parent' });
      f.move(null);
      expect(f.parentId).toBeNull();
    });
  });
});
