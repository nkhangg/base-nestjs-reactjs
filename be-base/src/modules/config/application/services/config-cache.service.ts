import { Injectable } from '@nestjs/common';
import type { AppConfig } from '../../domain/entities/app-config.entity';

interface CacheEntry {
  value: AppConfig;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class ConfigCacheService {
  private readonly store = new Map<string, CacheEntry>();

  get(key: string): AppConfig | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, config: AppConfig): void {
    this.store.set(key, { value: config, expiresAt: Date.now() + TTL_MS });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
