import { UploadFileUseCase } from './upload-file.use-case';
import type { IMediaFileRepository } from '../../domain/repositories/media-file.repository';
import type { IStorageProvider } from '../ports/storage.provider';
import type { IDomainEventBus } from '../../../../core/events/domain/domain-event-bus.interface';
import { FileUploadedEvent } from '../../domain/events/file-uploaded.event';
import { MediaFile } from '../../domain/entities/media-file.entity';

// Mock sharp before any imports trigger it
jest.mock('sharp', () => {
  const chain = {
    metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumb-data')),
  };
  return jest.fn(() => chain);
});

const makeRepo = (): jest.Mocked<IMediaFileRepository> => ({
  findById: jest.fn(),
  findByKey: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
});

const makeEventBus = (): jest.Mocked<IDomainEventBus> => ({
  publish: jest.fn(),
  publishAll: jest.fn(),
});

const makeStorage = (): jest.Mocked<IStorageProvider> => ({
  upload: jest
    .fn()
    .mockImplementation((key: string) =>
      Promise.resolve({ key, url: `http://localhost:3000/media/serve/${key}` }),
    ),
  delete: jest.fn().mockResolvedValue(undefined),
  getPublicUrl: jest.fn(
    (key: string) => `http://localhost:3000/media/serve/${key}`,
  ),
  getSignedUrl: jest.fn((key: string) =>
    Promise.resolve(`http://localhost:3000/media/serve/${key}`),
  ),
});

describe('UploadFileUseCase', () => {
  let useCase: UploadFileUseCase;
  let repo: jest.Mocked<IMediaFileRepository>;
  let storage: jest.Mocked<IStorageProvider>;
  let eventBus: jest.Mocked<IDomainEventBus>;

  beforeEach(() => {
    repo = makeRepo();
    storage = makeStorage();
    eventBus = makeEventBus();
    useCase = new UploadFileUseCase(repo, storage, eventBus);
  });

  it('returns a saved MediaFile entity', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('data'),
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 4,
      scope: 'public',
    });

    expect(result).toBeInstanceOf(MediaFile);
    expect(result.filename).toBe('photo.jpg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.scope).toBe('public');
    expect(repo.save).toHaveBeenCalledWith(result);
  });

  it('key follows YYYY/MM/<uuid>.<ext> format', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('data'),
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      size: 10,
    });

    expect(result.key).toMatch(/^\d{4}\/\d{2}\/[a-f0-9-]+\.pdf$/);
  });

  it('uploads file to storage and stores the returned URL', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('data'),
      originalname: 'img.png',
      mimetype: 'image/png',
      size: 8,
    });

    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/\.png$/),
      expect.any(Buffer),
      'image/png',
    );
    expect(result.url).toContain('/media/serve/');
  });

  it('generates thumbnail for image uploads', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('img-data'),
      originalname: 'hero.jpg',
      mimetype: 'image/jpeg',
      size: 8,
    });

    // storage.upload called twice: main file + thumbnail
    expect(storage.upload).toHaveBeenCalledTimes(2);
    expect(result.thumbnailKey).toMatch(/_thumb\.jpg$/);
    expect(result.thumbnailUrl).toBeTruthy();
  });

  it('stores image dimensions from sharp metadata', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('img-data'),
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 8,
    });

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('does NOT generate thumbnail for non-image files', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('pdf-data'),
      originalname: 'report.pdf',
      mimetype: 'application/pdf',
      size: 8,
    });

    expect(storage.upload).toHaveBeenCalledTimes(1);
    expect(result.thumbnailKey).toBeNull();
    expect(result.width).toBeNull();
  });

  it('saves with private scope when specified', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('data'),
      originalname: 'secret.pdf',
      mimetype: 'application/pdf',
      size: 4,
      scope: 'private',
    });

    expect(result.scope).toBe('private');
  });

  it('stores folderId, tags and createdBy', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('data'),
      originalname: 'img.jpg',
      mimetype: 'image/jpeg',
      size: 4,
      folderId: 'folder-1',
      tags: ['hero', 'banner'],
      createdBy: 'admin-1',
    });

    expect(result.folderId).toBe('folder-1');
    expect(result.tags).toEqual(['hero', 'banner']);
    expect(result.createdBy).toBe('admin-1');
  });

  it('publishes FileUploadedEvent with correct payload after save', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from('data'),
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 4,
      createdBy: 'admin-1',
    });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as FileUploadedEvent;
    expect(event).toBeInstanceOf(FileUploadedEvent);
    expect(event.eventName).toBe('media.file_uploaded');
    expect(event.fileId).toBe(result.id.value);
    expect(event.filename).toBe('photo.jpg');
    expect(event.uploadedBy).toBe('admin-1');
  });

  it('publishes event even without createdBy (uploadedBy is undefined)', async () => {
    await useCase.execute({
      buffer: Buffer.from('data'),
      originalname: 'anon.pdf',
      mimetype: 'application/pdf',
      size: 4,
    });

    const event = eventBus.publish.mock.calls[0][0] as FileUploadedEvent;
    expect(event.uploadedBy).toBeUndefined();
  });

  it('proceeds without thumbnail when sharp fails (non-fatal)', async () => {
    const sharp = require('sharp') as jest.Mock;
    sharp.mockReturnValueOnce({
      metadata: jest.fn().mockRejectedValue(new Error('sharp error')),
      resize: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockRejectedValue(new Error('sharp error')),
    });

    const result = await useCase.execute({
      buffer: Buffer.from('bad-img'),
      originalname: 'broken.jpg',
      mimetype: 'image/jpeg',
      size: 4,
    });

    // Still saves the file, just without thumbnail
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.thumbnailKey).toBeNull();
  });
});
