import { Injectable } from '@nestjs/common';
import type { Action } from '../../domain/value-objects/action.vo';

export type PermissionMap = Map<string, Set<Action>>; // resource → actions

interface CacheEntry {
  map: PermissionMap;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class PermissionCache {
  private readonly store = new Map<string, CacheEntry>();

  private key(subjectId: string, subjectType: string): string {
    return `${subjectType}:${subjectId}`;
  }

  get(subjectId: string, subjectType: string): PermissionMap | null {
    const entry = this.store.get(this.key(subjectId, subjectType));
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.key(subjectId, subjectType));
      return null;
    }
    return entry.map;
  }

  set(subjectId: string, subjectType: string, map: PermissionMap): void {
    this.store.set(this.key(subjectId, subjectType), {
      map,
      expiresAt: Date.now() + TTL_MS,
    });
  }

  invalidate(subjectId: string, subjectType?: string): void {
    if (subjectType) {
      this.store.delete(this.key(subjectId, subjectType));
    } else {
      for (const k of Array.from(this.store.keys())) {
        if (k.slice(k.indexOf(':') + 1) === subjectId) this.store.delete(k);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}
