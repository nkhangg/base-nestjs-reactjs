import { Injectable } from '@nestjs/common';
import type { Action } from '../../domain/value-objects/action.vo';

export type PermissionMap = Map<string, Set<Action>>;

export const PERMISSION_CACHE = Symbol('PERMISSION_CACHE');

export interface IPermissionCache {
  get(subjectId: string, subjectType: string): Promise<PermissionMap | null>;
  set(subjectId: string, subjectType: string, map: PermissionMap): Promise<void>;
  invalidate(subjectId: string, subjectType?: string): Promise<void>;
  clear(): Promise<void>;
}

const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  map: PermissionMap;
  expiresAt: number;
}

@Injectable()
export class InMemoryPermissionCache implements IPermissionCache {
  private readonly store = new Map<string, CacheEntry>();

  private key(subjectId: string, subjectType: string): string {
    return `${subjectType}:${subjectId}`;
  }

  async get(subjectId: string, subjectType: string): Promise<PermissionMap | null> {
    const entry = this.store.get(this.key(subjectId, subjectType));
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.key(subjectId, subjectType));
      return null;
    }
    return entry.map;
  }

  async set(subjectId: string, subjectType: string, map: PermissionMap): Promise<void> {
    this.store.set(this.key(subjectId, subjectType), {
      map,
      expiresAt: Date.now() + TTL_MS,
    });
  }

  async invalidate(subjectId: string, subjectType?: string): Promise<void> {
    if (subjectType) {
      this.store.delete(this.key(subjectId, subjectType));
    } else {
      for (const k of Array.from(this.store.keys())) {
        if (k.slice(k.indexOf(':') + 1) === subjectId) this.store.delete(k);
      }
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
