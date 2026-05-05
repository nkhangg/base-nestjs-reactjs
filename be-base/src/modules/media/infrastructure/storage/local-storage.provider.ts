import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type {
  IStorageProvider,
  UploadResult,
} from '../../application/ports/storage.provider';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    // APP_BASE_URL = origin only, e.g. http://localhost:3000 (no trailing slash, no /uploads)
    this.baseUrl = (
      process.env.APP_BASE_URL ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    key: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<UploadResult> {
    const filePath = path.join(this.uploadDir, ...key.split('/'));
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return { key, url: this.getPublicUrl(key) };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, ...key.split('/'));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getPublicUrl(key: string): string {
    // All files — public and private — are served through the controller
    // which enforces scope + auth. Never expose /uploads/ directly.
    return `${this.baseUrl}/media/serve/${key}`;
  }

  async getSignedUrl(key: string, _ttlSeconds = 3600): Promise<string> {
    return this.getPublicUrl(key);
  }
}
