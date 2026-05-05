import { DeleteFolderUseCase } from './delete-folder.use-case';
import type { IMediaFolderRepository } from '../../domain/repositories/media-folder.repository';
import { MediaFolder } from '../../domain/entities/media-folder.entity';

const makeRepo = (): jest.Mocked<IMediaFolderRepository> => ({
  findById: jest.fn(),
  findByParentId: jest.fn(),
  findAll: jest.fn(),
  hasChildren: jest.fn().mockResolvedValue(false),
  hasFiles: jest.fn().mockResolvedValue(false),
  save: jest.fn(),
  delete: jest.fn().mockResolvedValue(undefined),
});

describe('DeleteFolderUseCase', () => {
  let useCase: DeleteFolderUseCase;
  let repo: jest.Mocked<IMediaFolderRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new DeleteFolderUseCase(repo);
  });

  it('returns FOLDER_NOT_FOUND when folder does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute('ghost-id');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FOLDER_NOT_FOUND');
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('returns FOLDER_HAS_SUBFOLDERS when folder has children', async () => {
    const folder = MediaFolder.create({ name: 'Parent' });
    repo.findById.mockResolvedValue(folder);
    repo.hasChildren.mockResolvedValue(true);

    const result = await useCase.execute(folder.id.value);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FOLDER_HAS_SUBFOLDERS');
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('returns FOLDER_HAS_FILES when folder contains files', async () => {
    const folder = MediaFolder.create({ name: 'WithFiles' });
    repo.findById.mockResolvedValue(folder);
    repo.hasChildren.mockResolvedValue(false);
    repo.hasFiles.mockResolvedValue(true);

    const result = await useCase.execute(folder.id.value);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('FOLDER_HAS_FILES');
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes an empty folder and returns ok', async () => {
    const folder = MediaFolder.create({ name: 'Empty' });
    repo.findById.mockResolvedValue(folder);

    const result = await useCase.execute(folder.id.value);

    expect(result.ok).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith(folder.id.value);
  });

  it('checks children before files (short-circuit order)', async () => {
    const folder = MediaFolder.create({ name: 'F' });
    repo.findById.mockResolvedValue(folder);
    repo.hasChildren.mockResolvedValue(true);

    await useCase.execute(folder.id.value);

    // hasFiles should NOT be called if hasChildren already returned true
    expect(repo.hasFiles).not.toHaveBeenCalled();
  });
});
