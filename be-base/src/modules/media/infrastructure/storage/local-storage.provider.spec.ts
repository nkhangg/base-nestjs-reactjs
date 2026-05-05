import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// Must import AFTER mocking fs
import { LocalStorageProvider } from './local-storage.provider';

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('LocalStorageProvider', () => {
  const key = '2026/04/abc-uuid.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.APP_BASE_URL;
    (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
  });

  describe('getPublicUrl', () => {
    it('returns /media/serve/<key> URL using default base', () => {
      const provider = new LocalStorageProvider();
      expect(provider.getPublicUrl(key)).toBe(
        `http://localhost:3000/media/serve/${key}`,
      );
    });

    it('uses APP_BASE_URL env var when set', () => {
      process.env.APP_BASE_URL = 'https://api.example.com';
      const provider = new LocalStorageProvider();
      expect(provider.getPublicUrl(key)).toBe(
        `https://api.example.com/media/serve/${key}`,
      );
      delete process.env.APP_BASE_URL;
    });

    it('strips trailing slash from APP_BASE_URL', () => {
      process.env.APP_BASE_URL = 'http://localhost:3000/';
      const provider = new LocalStorageProvider();
      expect(provider.getPublicUrl(key)).not.toContain('//media');
      delete process.env.APP_BASE_URL;
    });

    it('public URL always uses /media/serve/ path (not /uploads/)', () => {
      const provider = new LocalStorageProvider();
      const url = provider.getPublicUrl(key);
      expect(url).toContain('/media/serve/');
      expect(url).not.toContain('/uploads/');
    });
  });

  describe('upload', () => {
    it('writes buffer to disk under the uploads directory', async () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
      const provider = new LocalStorageProvider();
      const buffer = Buffer.from('file-content');

      await provider.upload(key, buffer, 'image/jpeg');

      const expectedPath = path.join(
        process.cwd(),
        'uploads',
        '2026',
        '04',
        'abc-uuid.jpg',
      );
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(expectedPath, buffer);
    });

    it('creates directory if it does not exist', async () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
      const provider = new LocalStorageProvider();

      await provider.upload(key, Buffer.from('x'), 'image/jpeg');

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
    });

    it('returns key and url from the upload result', async () => {
      const provider = new LocalStorageProvider();
      const result = await provider.upload(key, Buffer.from('x'), 'image/jpeg');

      expect(result.key).toBe(key);
      expect(result.url).toBe(provider.getPublicUrl(key));
    });
  });

  describe('delete', () => {
    it('removes file from disk when it exists', async () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
      const provider = new LocalStorageProvider();

      await provider.delete(key);

      expect(mockedFs.unlinkSync).toHaveBeenCalledWith(
        path.join(process.cwd(), 'uploads', '2026', '04', 'abc-uuid.jpg'),
      );
    });

    it('does nothing when file does not exist', async () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
      const provider = new LocalStorageProvider();

      await provider.delete(key);

      expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('getSignedUrl', () => {
    it('returns the same as getPublicUrl for local storage', async () => {
      const provider = new LocalStorageProvider();
      const signed = await provider.getSignedUrl(key);
      expect(signed).toBe(provider.getPublicUrl(key));
    });
  });
});
