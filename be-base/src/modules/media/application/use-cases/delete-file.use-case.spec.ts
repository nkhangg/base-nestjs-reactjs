import { DeleteFileUseCase } from './delete-file.use-case';
import type { IMediaFileRepository } from '../../domain/repositories/media-file.repository';
import type { IStorageProvider } from '../ports/storage.provider';
import { MediaFile } from '../../domain/entities/media-file.entity';

const makeRepo = (): jest.Mocked<IMediaFileRepository> => ({
  findById: jest.fn(),
  findByKey: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  delete: jest.fn().mockResolvedValue(undefined),
});

const makeStorage = (): jest.Mocked<IStorageProvider> => ({
  upload: jest.fn(),
  delete: jest.fn().mockResolvedValue(undefined),
  getPublicUrl: jest.fn(),
  getSignedUrl: jest.fn(),
});

function makeFile(withThumbnail = false) {
  return MediaFile.create({
    key: '2026/04/file.pdf',
    filename: 'report.pdf',
    mimeType: 'application/pdf',
    size: 512,
    url: 'http://localhost:3000/media/serve/2026/04/file.pdf',
    thumbnailKey: withThumbnail ? '2026/04/file_thumb.jpg' : undefined,
    thumbnailUrl: withThumbnail
      ? 'http://localhost:3000/media/serve/2026/04/file_thumb.jpg'
      : undefined,
  });
}

describe('DeleteFileUseCase', () => {
  let useCase: DeleteFileUseCase;
  let repo: jest.Mocked<IMediaFileRepository>;
  let storage: jest.Mocked<IStorageProvider>;

  beforeEach(() => {
    repo = makeRepo();
    storage = makeStorage();
    useCase = new DeleteFileUseCase(repo, storage);
  });

  it('returns FILE_NOT_FOUND when file does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute('missing-id');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FILE_NOT_FOUND');
    expect(storage.delete).not.toHaveBeenCalled();
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes file from storage and repo', async () => {
    const file = makeFile();
    repo.findById.mockResolvedValue(file);

    const result = await useCase.execute(file.id.value);

    expect(result.ok).toBe(true);
    expect(storage.delete).toHaveBeenCalledWith('2026/04/file.pdf');
    expect(repo.delete).toHaveBeenCalledWith(file.id.value);
  });

  it('also deletes thumbnail from storage when present', async () => {
    const file = makeFile(true);
    repo.findById.mockResolvedValue(file);

    await useCase.execute(file.id.value);

    expect(storage.delete).toHaveBeenCalledTimes(2);
    expect(storage.delete).toHaveBeenCalledWith('2026/04/file.pdf');
    expect(storage.delete).toHaveBeenCalledWith('2026/04/file_thumb.jpg');
  });

  it('does NOT call thumbnail delete when thumbnailKey is null', async () => {
    const file = makeFile(false);
    repo.findById.mockResolvedValue(file);

    await useCase.execute(file.id.value);

    expect(storage.delete).toHaveBeenCalledTimes(1);
  });

  it('still deletes repo record even if thumbnail storage delete fails', async () => {
    const file = makeFile(true);
    repo.findById.mockResolvedValue(file);
    storage.delete
      .mockResolvedValueOnce(undefined) // main file ok
      .mockRejectedValueOnce(new Error('not found')); // thumbnail fails

    const result = await useCase.execute(file.id.value);

    expect(result.ok).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith(file.id.value);
  });
});
