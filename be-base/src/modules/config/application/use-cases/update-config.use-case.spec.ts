import { UpdateConfigUseCase } from './update-config.use-case';
import type { IConfigRepository } from '../../domain/repositories/config.repository';
import type { IDomainEventBus } from '../../../../core/events/domain/domain-event-bus.interface';
import { ConfigChangedEvent } from '../../domain/events/config-changed.event';
import { ConfigCacheService } from '../services/config-cache.service';
import { AppConfig } from '../../domain/entities/app-config.entity';

const makeRepo = (): jest.Mocked<IConfigRepository> => ({
  findById: jest.fn(),
  findByKey: jest.fn(),
  findByKeys: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn(),
  existsByKey: jest.fn(),
});

const makeEventBus = (): jest.Mocked<IDomainEventBus> => ({
  publish: jest.fn(),
  publishAll: jest.fn(),
});

const makeConfig = (
  id = 'cfg-1',
  key = 'homepage.hero',
  value: unknown = { title: 'Old' },
) =>
  AppConfig.reconstitute(id, {
    key: { value: key } as any,
    value,
    valueKeyOrder: [],
    description: null,
    isEnabled: true,
    scope: 'public',
    tags: [],
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('UpdateConfigUseCase', () => {
  let useCase: UpdateConfigUseCase;
  let repo: jest.Mocked<IConfigRepository>;
  let cache: ConfigCacheService;
  let eventBus: jest.Mocked<IDomainEventBus>;

  beforeEach(() => {
    repo = makeRepo();
    cache = new ConfigCacheService();
    eventBus = makeEventBus();
    useCase = new UpdateConfigUseCase(repo, cache, eventBus);
  });

  it('updates config and saves', async () => {
    repo.findById.mockResolvedValue(makeConfig());

    const result = await useCase.execute({
      id: 'cfg-1',
      value: { title: 'New' },
    });

    expect(result.ok).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved: AppConfig = repo.save.mock.calls[0][0];
    expect(saved.value).toEqual({ title: 'New' });
  });

  it('publishes ConfigChangedEvent with old and new value', async () => {
    const oldValue = { title: 'Old' };
    repo.findById.mockResolvedValue(makeConfig('cfg-1', 'site.hero', oldValue));

    await useCase.execute({
      id: 'cfg-1',
      value: { title: 'New' },
      updatedBy: 'admin-1',
    });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as ConfigChangedEvent;
    expect(event).toBeInstanceOf(ConfigChangedEvent);
    expect(event.eventName).toBe('config.changed');
    expect(event.configId).toBe('cfg-1');
    expect(event.key).toBe('site.hero');
    expect(event.oldValue).toEqual(oldValue);
    expect(event.newValue).toEqual({ title: 'New' });
    expect(event.changedBy).toBe('admin-1');
  });

  it('does NOT publish event when value is not in the update input', async () => {
    repo.findById.mockResolvedValue(makeConfig());

    await useCase.execute({ id: 'cfg-1', description: 'Updated description' });

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND and does not publish event', async () => {
    repo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ id: 'ghost', value: { x: 1 } });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_FOUND');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('invalidates cache after save', async () => {
    const invalidateSpy = jest.spyOn(cache, 'invalidate');
    repo.findById.mockResolvedValue(makeConfig('cfg-1', 'my.key'));

    await useCase.execute({ id: 'cfg-1', value: { v: 1 } });

    expect(invalidateSpy).toHaveBeenCalledWith('my.key');
  });
});
