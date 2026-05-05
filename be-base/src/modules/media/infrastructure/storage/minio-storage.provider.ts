import { Injectable } from '@nestjs/common';
import type {
  IStorageProvider,
  UploadResult,
} from '../../application/ports/storage.provider';

// MinIO client is loaded dynamically to keep it optional in dev environments.
// Install `minio` package when STORAGE_TYPE=minio.

@Injectable()
export class MinioStorageProvider implements IStorageProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor() {
    this.bucket = process.env.MINIO_BUCKET ?? 'media';
    this.baseUrl = process.env.MINIO_BASE_URL ?? 'http://localhost:9000';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Minio = require('minio') as { Client: new (opts: object) => unknown };
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    });
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
    return { key, url: this.getPublicUrl(key) };
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/${this.bucket}/${key}`;
  }

  async getSignedUrl(key: string, ttlSeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(
      this.bucket,
      key,
      ttlSeconds,
    ) as Promise<string>;
  }
}
