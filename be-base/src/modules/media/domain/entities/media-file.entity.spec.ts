import { MediaFile } from './media-file.entity';

describe('MediaFile', () => {
  const base = {
    key: '2026/04/abc.jpg',
    filename: 'photo.jpg',
    mimeType: 'image/jpeg',
    size: 12345,
    url: 'http://localhost:3000/media/serve/2026/04/abc.jpg',
  };

  describe('create', () => {
    it('generates a unique id and timestamps', () => {
      const f = MediaFile.create(base);
      expect(f.id.value).toBeTruthy();
      expect(f.createdAt).toBeInstanceOf(Date);
      expect(f.updatedAt).toBeInstanceOf(Date);
    });

    it('defaults scope to public', () => {
      expect(MediaFile.create(base).scope).toBe('public');
    });

    it('accepts private scope', () => {
      expect(MediaFile.create({ ...base, scope: 'private' }).scope).toBe(
        'private',
      );
    });

    it('defaults optional fields to null / empty', () => {
      const f = MediaFile.create(base);
      expect(f.width).toBeNull();
      expect(f.height).toBeNull();
      expect(f.thumbnailKey).toBeNull();
      expect(f.thumbnailUrl).toBeNull();
      expect(f.alt).toBeNull();
      expect(f.folderId).toBeNull();
      expect(f.tags).toEqual([]);
      expect(f.createdBy).toBeNull();
      expect(f.updatedBy).toBeNull();
    });

    it('stores provided optional fields', () => {
      const f = MediaFile.create({
        ...base,
        width: 800,
        height: 600,
        thumbnailKey: '2026/04/abc_thumb.jpg',
        thumbnailUrl: 'http://localhost:3000/media/serve/2026/04/abc_thumb.jpg',
        alt: 'A photo',
        folderId: 'folder-1',
        tags: ['hero', 'banner'],
        createdBy: 'admin-1',
      });
      expect(f.width).toBe(800);
      expect(f.height).toBe(600);
      expect(f.alt).toBe('A photo');
      expect(f.tags).toEqual(['hero', 'banner']);
      expect(f.createdBy).toBe('admin-1');
    });

    it('generates unique ids for each file', () => {
      const a = MediaFile.create(base);
      const b = MediaFile.create(base);
      expect(a.id.value).not.toBe(b.id.value);
    });
  });

  describe('reconstitute', () => {
    it('restores all fields with the given id', () => {
      const now = new Date('2026-01-01');
      const f = MediaFile.reconstitute('fixed-id', {
        key: base.key,
        filename: base.filename,
        mimeType: base.mimeType,
        size: base.size,
        url: base.url,
        width: 100,
        height: 80,
        thumbnailKey: null,
        thumbnailUrl: null,
        alt: null,
        scope: 'private',
        folderId: null,
        tags: [],
        createdBy: null,
        updatedBy: null,
        createdAt: now,
        updatedAt: now,
      });
      expect(f.id.value).toBe('fixed-id');
      expect(f.scope).toBe('private');
      expect(f.createdAt).toBe(now);
    });
  });

  describe('updateMeta', () => {
    it('updates filename', () => {
      const f = MediaFile.create(base);
      f.updateMeta({ filename: 'new-name.jpg' });
      expect(f.filename).toBe('new-name.jpg');
    });

    it('updates scope from public to private', () => {
      const f = MediaFile.create(base);
      expect(f.scope).toBe('public');
      f.updateMeta({ scope: 'private' });
      expect(f.scope).toBe('private');
    });

    it('updates scope from private to public', () => {
      const f = MediaFile.create({ ...base, scope: 'private' });
      f.updateMeta({ scope: 'public' });
      expect(f.scope).toBe('public');
    });

    it('sets alt to null', () => {
      const f = MediaFile.create({ ...base, alt: 'old' });
      f.updateMeta({ alt: null });
      expect(f.alt).toBeNull();
    });

    it('updates folderId to null (moves to root)', () => {
      const f = MediaFile.create({ ...base, folderId: 'folder-1' });
      f.updateMeta({ folderId: null });
      expect(f.folderId).toBeNull();
    });

    it('replaces tags', () => {
      const f = MediaFile.create({ ...base, tags: ['old'] });
      f.updateMeta({ tags: ['new', 'tags'] });
      expect(f.tags).toEqual(['new', 'tags']);
    });

    it('updates updatedAt', () => {
      const f = MediaFile.create(base);
      const before = f.updatedAt;
      // Force time to move forward
      jest.useFakeTimers();
      jest.advanceTimersByTime(100);
      f.updateMeta({ filename: 'changed.jpg' });
      expect(f.updatedAt.getTime()).toBeGreaterThan(before.getTime());
      jest.useRealTimers();
    });

    it('records updatedBy', () => {
      const f = MediaFile.create(base);
      f.updateMeta({ updatedBy: 'admin-99' });
      expect(f.updatedBy).toBe('admin-99');
    });

    it('does not modify fields when params are undefined', () => {
      const f = MediaFile.create({ ...base, tags: ['keep'] });
      f.updateMeta({});
      expect(f.tags).toEqual(['keep']);
      expect(f.filename).toBe(base.filename);
    });
  });
});
