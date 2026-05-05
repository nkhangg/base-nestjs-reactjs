import { CreateFolderUseCase } from './create-folder.use-case';
import type { IMediaFolderRepository } from '../../domain/repositories/media-folder.repository';
import { MediaFolder } from '../../domain/entities/media-folder.entity';

const makeRepo = (): jest.Mocked<IMediaFolderRepository> => ({
  findById: jest.fn(),
  findByParentId: jest.fn(),
  findAll: jest.fn(),
  hasChildren: jest.fn(),
  hasFiles: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
});

describe('CreateFolderUseCase', () => {
  let useCase: CreateFolderUseCase;
  let repo: jest.Mocked<IMediaFolderRepository>;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new CreateFolderUseCase(repo);
  });

  it('creates a root folder (no parentId) and returns folderId', async () => {
    const result = await useCase.execute({ name: 'Photos' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.folderId).toBeTruthy();
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('creates a sub-folder when parent exists', async () => {
    const parent = MediaFolder.create({ name: 'Root' });
    repo.findById.mockResolvedValue(parent);

    const result = await useCase.execute({
      name: 'Sub',
      parentId: parent.id.value,
    });

    expect(result.ok).toBe(true);
    expect(repo.findById).toHaveBeenCalledWith(parent.id.value);
    const saved = repo.save.mock.calls[0][0] as MediaFolder;
    expect(saved.parentId).toBe(parent.id.value);
  });

  it('returns PARENT_FOLDER_NOT_FOUND when parent does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ name: 'Sub', parentId: 'ghost-id' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('PARENT_FOLDER_NOT_FOUND');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('stores createdBy when provided', async () => {
    await useCase.execute({ name: 'Docs', createdBy: 'admin-1' });

    const saved = repo.save.mock.calls[0][0] as MediaFolder;
    expect(saved.createdBy).toBe('admin-1');
  });

  it('folder name is stored correctly', async () => {
    await useCase.execute({ name: 'My Uploads' });

    const saved = repo.save.mock.calls[0][0] as MediaFolder;
    expect(saved.name).toBe('My Uploads');
  });
});
