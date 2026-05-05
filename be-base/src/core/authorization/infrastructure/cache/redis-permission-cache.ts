import { Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { Action } from '../../domain/value-objects/action.vo';
import type { IPermissionCache, PermissionMap } from './permission-cache';

const TTL_SECONDS = 5 * 60;
const KEY_PREFIX = 'perm:';

function serialize(map: PermissionMap): string {
  const obj: Record<string, Action[]> = {};
  map.forEach((actions, resource) => {
    obj[resource] = [...actions];
  });
  return JSON.stringify(obj);
}

function deserialize(raw: string): PermissionMap {
  const obj = JSON.parse(raw) as Record<string, Action[]>;
  const map: PermissionMap = new Map();
  for (const [resource, actions] of Object.entries(obj)) {
    map.set(resource, new Set(actions));
  }
  return map;
}

export class RedisPermissionCache implements IPermissionCache {
  private readonly logger = new Logger(RedisPermissionCache.name);

  constructor(private readonly redis: Redis) {}

  private key(subjectId: string, subjectType: string): string {
    return `${KEY_PREFIX}${subjectType}:${subjectId}`;
  }

  async get(
    subjectId: string,
    subjectType: string,
  ): Promise<PermissionMap | null> {
    try {
      const raw = await this.redis.get(this.key(subjectId, subjectType));
      if (!raw) return null;
      return deserialize(raw);
    } catch {
      return null;
    }
  }

  async set(
    subjectId: string,
    subjectType: string,
    map: PermissionMap,
  ): Promise<void> {
    try {
      await this.redis.setex(
        this.key(subjectId, subjectType),
        TTL_SECONDS,
        serialize(map),
      );
    } catch (err) {
      this.logger.warn(`Cache set failed: ${(err as Error).message}`);
    }
  }

  async invalidate(subjectId: string, subjectType?: string): Promise<void> {
    try {
      if (subjectType) {
        await this.redis.del(this.key(subjectId, subjectType));
      } else {
        const keys = await this.scanKeys(`${KEY_PREFIX}*:${subjectId}`);
        if (keys.length > 0) await this.redis.del(keys);
      }
    } catch (err) {
      this.logger.warn(`Cache invalidate failed: ${(err as Error).message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.scanKeys(`${KEY_PREFIX}*`);
      if (keys.length > 0) await this.redis.del(keys);
    } catch (err) {
      this.logger.warn(`Cache clear failed: ${(err as Error).message}`);
    }
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }
}
