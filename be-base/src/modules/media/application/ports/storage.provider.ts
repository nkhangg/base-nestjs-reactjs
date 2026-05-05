export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface UploadResult {
  key: string;
  url: string;
}

export interface IStorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  getSignedUrl(key: string, ttlSeconds?: number): Promise<string>;
}
