import { UpdateFileMetaUseCase } from './update-file-meta.use-case';
import type { IMediaFileRepository } from '../../domain/repositories/media-file.repository';
import { MediaFile } from '../../domain/entities/media-file.entity';

const makeRepo = (): jest.Mocked<IMediaFileRepository> => ({
  findById: jest.fn(),
  findByKey: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
});

function makeFile(
  overrides: Partial<Parameters<typeof MediaFile.create>[0]> = {},
) {
  return MediaFile.create({
    key: '2026/04/test.jpg',
    filename: 'test.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    url: 'http://localhost:3000/media/serve/2026/04/test.jpg',
    ...overrides,
  });
}

describe('UpdateFileMetaUseCase', () => {
  let useCase: UpdateFileMetaUseCase;
  let repo: jest.Mocked<IMediaFileRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new UpdateFileMetaUseCase(repo);
  });

  it('returns FILE_NOT_FOUND when file does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ id: 'missing-id' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FILE_NOT_FOUND');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('updates filename and saves', async () => {
    const file = makeFile();
    repo.findById.mockResolvedValue(file);

    const result = await useCase.execute({
      id: file.id.value,
      filename: 'renamed.jpg',
    });

    expect(result.ok).toBe(true);
    expect(file.filename).toBe('renamed.jpg');
    expect(repo.save).toHaveBeenCalledWith(file);
  });

  it('changes scope from public to private', async () => {
    const file = makeFile({ scope: 'public' });
    repo.findById.mockResolvedValue(file);

    await useCase.execute({ id: file.id.value, scope: 'private' });

    expect(file.scope).toBe('private');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('changes scope from private to public', async () => {
    const file = makeFile({ scope: 'private' });
    repo.findById.mockResolvedValue(file);

    await useCase.execute({ id: file.id.value, scope: 'public' });

    expect(file.scope).toBe('public');
  });

  it('moves file to a folder', async () => {
    const file = makeFile();
    repo.findById.mockResolvedValue(file);

    await useCase.execute({ id: file.id.value, folderId: 'folder-99' });

    expect(file.folderId).toBe('folder-99');
  });

  it('moves file to root (folderId null)', async () => {
    const file = makeFile({ folderId: 'some-folder' });
    repo.findById.mockResolvedValue(file);

    await useCase.execute({ id: file.id.value, folderId: null });

    expect(file.folderId).toBeNull();
  });

  it('updates tags', async () => {
    const file = makeFile();
    repo.findById.mockResolvedValue(file);

    await useCase.execute({ id: file.id.value, tags: ['a', 'b'] });

    expect(file.tags).toEqual(['a', 'b']);
  });

  it('records updatedBy', async () => {
    const file = makeFile();
    repo.findById.mockResolvedValue(file);

    await useCase.execute({ id: file.id.value, updatedBy: 'admin-42' });

    expect(file.updatedBy).toBe('admin-42');
  });

  it('returns ok:true on success', async () => {
    const file = makeFile();
    repo.findById.mockResolvedValue(file);

    const result = await useCase.execute({
      id: file.id.value,
      filename: 'ok.jpg',
    });

    expect(result.ok).toBe(true);
  });
});
