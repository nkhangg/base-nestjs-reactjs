import { MediaMapper } from './media.mapper';
import { MediaFile } from '../../domain/entities/media-file.entity';
import { MediaFolder } from '../../domain/entities/media-folder.entity';

const now = new Date('2026-04-01T00:00:00Z');

const fileRecord = {
  id: 'file-id-1',
  key: '2026/04/uuid.jpg',
  filename: 'photo.jpg',
  mimeType: 'image/jpeg',
  size: 2048,
  width: 800,
  height: 600,
  url: 'http://localhost:3000/media/serve/2026/04/uuid.jpg',
  thumbnailKey: '2026/04/uuid_thumb.jpg',
  thumbnailUrl: 'http://localhost:3000/media/serve/2026/04/uuid_thumb.jpg',
  alt: 'A photo',
  scope: 'public',
  folderId: 'folder-1',
  tags: ['hero'],
  createdBy: 'admin-1',
  updatedBy: null,
  createdAt: now,
  updatedAt: now,
};

const folderRecord = {
  id: 'folder-id-1',
  name: 'Photos',
  parentId: null,
  createdBy: 'admin-1',
  createdAt: now,
  updatedAt: now,
};

describe('MediaMapper', () => {
  describe('fileToDomail', () => {
    it('maps all fields from Prisma record to MediaFile domain entity', () => {
      const f = MediaMapper.fileToDomail(fileRecord as any);

      expect(f).toBeInstanceOf(MediaFile);
      expect(f.id.value).toBe(fileRecord.id);
      expect(f.key).toBe(fileRecord.key);
      expect(f.filename).toBe(fileRecord.filename);
      expect(f.mimeType).toBe(fileRecord.mimeType);
      expect(f.size).toBe(fileRecord.size);
      expect(f.width).toBe(fileRecord.width);
      expect(f.height).toBe(fileRecord.height);
      expect(f.url).toBe(fileRecord.url);
      expect(f.thumbnailKey).toBe(fileRecord.thumbnailKey);
      expect(f.thumbnailUrl).toBe(fileRecord.thumbnailUrl);
      expect(f.alt).toBe(fileRecord.alt);
      expect(f.scope).toBe('public');
      expect(f.folderId).toBe(fileRecord.folderId);
      expect(f.tags).toEqual(fileRecord.tags);
      expect(f.createdBy).toBe(fileRecord.createdBy);
      expect(f.createdAt).toBe(now);
    });

    it('handles null nullable fields', () => {
      const f = MediaMapper.fileToDomail({
        ...fileRecord,
        width: null,
        height: null,
        thumbnailKey: null,
        thumbnailUrl: null,
        alt: null,
        folderId: null,
        updatedBy: null,
      } as any);

      expect(f.width).toBeNull();
      expect(f.thumbnailKey).toBeNull();
      expect(f.alt).toBeNull();
      expect(f.folderId).toBeNull();
    });

    it('maps private scope correctly', () => {
      const f = MediaMapper.fileToDomail({
        ...fileRecord,
        scope: 'private',
      } as any);
      expect(f.scope).toBe('private');
    });
  });

  describe('folderToDomain', () => {
    it('maps all fields from Prisma record to MediaFolder domain entity', () => {
      const f = MediaMapper.folderToDomain(folderRecord as any);

      expect(f).toBeInstanceOf(MediaFolder);
      expect(f.id.value).toBe(folderRecord.id);
      expect(f.name).toBe(folderRecord.name);
      expect(f.parentId).toBeNull();
      expect(f.createdBy).toBe(folderRecord.createdBy);
      expect(f.createdAt).toBe(now);
    });

    it('maps parentId when set', () => {
      const f = MediaMapper.folderToDomain({
        ...folderRecord,
        parentId: 'p-1',
      } as any);
      expect(f.parentId).toBe('p-1');
    });
  });
});
