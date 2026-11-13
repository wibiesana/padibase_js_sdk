import { BaseService } from './BaseService.js';
import type { SendOptions } from '../types.js';

export interface StorageUploadResult {
  uploaded: boolean;
  bucket: string;
  filename: string;
  original_name?: string;
  key: string;
  path: string;
  url: string;
  size: number;
  mime: string;
  [key: string]: any;
}

export class FileService extends BaseService {
  /**
   * Constructs the absolute URL to access a stored file in Storage.
   *
   * Supports:
   * - `getUrl('/api/storage/avatars/photo.png')`
   * - `getUrl('avatars', 'photo.png', { download: 1 })`
   * - Legacy: `getUrl('users', 'rec_1', 'avatar.png', { thumb: '100x100' })`
   */
  getUrl(
    bucketOrTable: string | { table?: string; id?: string },
    filenameOrRecordId?: string | Record<string, any>,
    filenameOrQuery?: string | Record<string, any>,
    query?: Record<string, any>
  ): string {
    // Legacy object form: getUrl({ table: 'posts', id: 'p_2' }, 'cover.jpg', query)
    if (typeof bucketOrTable === 'object' && bucketOrTable !== null) {
      const tblName = bucketOrTable.table || '';
      const recId = bucketOrTable.id || '';
      const fName = typeof filenameOrRecordId === 'string' ? filenameOrRecordId : '';
      const q = typeof filenameOrQuery === 'object' ? filenameOrQuery : query;
      const path = `/api/files/${encodeURIComponent(tblName)}/${encodeURIComponent(recId)}/${encodeURIComponent(fName)}`;
      return this.client.buildUrl(path, q);
    }

    const first = (bucketOrTable || '').trim();

    // Direct path or full URL: getUrl('/api/storage/avatars/pic.png', { download: 1 })
    if (
      first.startsWith('http://') ||
      first.startsWith('https://') ||
      first.startsWith('/api/storage/') ||
      first.startsWith('/api/files/')
    ) {
      const q = typeof filenameOrRecordId === 'object' ? filenameOrRecordId : query;
      return this.client.buildUrl(first, q);
    }

    // Legacy 3-string form: getUrl('users', 'rec_1', 'avatar.png', query)
    if (typeof filenameOrRecordId === 'string' && typeof filenameOrQuery === 'string') {
      const path = `/api/files/${encodeURIComponent(first)}/${encodeURIComponent(filenameOrRecordId)}/${encodeURIComponent(filenameOrQuery)}`;
      return this.client.buildUrl(path, query);
    }

    // Storage bucket + filename form: getUrl('avatars', 'photo.png', query)
    if (typeof filenameOrRecordId === 'string') {
      const q = typeof filenameOrQuery === 'object' ? filenameOrQuery : query;
      const path = `/api/storage/${encodeURIComponent(first)}/${encodeURIComponent(filenameOrRecordId)}`;
      return this.client.buildUrl(path, q);
    }

    // Shorthand 'bucket/filename'
    if (first.includes('/')) {
      const [bucket, ...rest] = first.split('/');
      const fname = rest.join('/');
      const path = `/api/storage/${encodeURIComponent(bucket)}/${encodeURIComponent(fname)}`;
      return this.client.buildUrl(path, query);
    }

    return this.client.buildUrl(`/api/storage/${encodeURIComponent(first)}`, query);
  }

  /**
   * Uploads a file to a Storage bucket and returns its URL & metadata so you can save the link in any table column.
   *
   * @example
   * ```js
   * const uploaded = await padi.storage.upload('avatars', fileInput.files[0]);
   * await padi.table('users').update(userId, { avatar_url: uploaded.url });
   * ```
   */
  async upload(
    bucket: string,
    fileOrRecordId: any,
    optionsOrFile?: SendOptions | any,
    legacyFieldName: string = 'file',
    legacyOptions: SendOptions = {}
  ): Promise<StorageUploadResult> {
    // Legacy signature support: upload(table, recordId, file, fieldName?, options?)
    if (typeof fileOrRecordId === 'string' && optionsOrFile !== undefined) {
      let legacyBody: any;
      if (typeof FormData !== 'undefined' && optionsOrFile instanceof FormData) {
        legacyBody = optionsOrFile;
      } else if (typeof FormData !== 'undefined') {
        legacyBody = new FormData();
        legacyBody.append(legacyFieldName, optionsOrFile);
      } else {
        legacyBody = optionsOrFile;
      }

      return this.client.send(
        `/api/files/${encodeURIComponent(bucket)}/${encodeURIComponent(fileOrRecordId)}`,
        {
          method: 'POST',
          body: legacyBody,
          ...legacyOptions,
        }
      );
    }

    const file = fileOrRecordId;
    const options: SendOptions = (optionsOrFile as SendOptions) || {};
    let body: any;

    if (typeof FormData !== 'undefined' && file instanceof FormData) {
      body = file;
    } else if (typeof FormData !== 'undefined') {
      body = new FormData();
      body.append('file', file);
    } else {
      body = file;
    }

    const res = await this.client.send<StorageUploadResult>(
      `/api/storage/${encodeURIComponent(bucket || 'uploads')}`,
      {
        method: 'POST',
        body,
        ...options,
      }
    );

    if (res && typeof res === 'object' && typeof res.url === 'string') {
      res.path = res.path || res.url;
      res.url = this.client.buildUrl(res.url);
    }

    return res;
  }

  /**
   * Deletes a file from a Storage bucket.
   */
  async delete(bucket: string, filename: string, options: SendOptions = {}): Promise<any> {
    return this.client.send(
      `/api/storage/${encodeURIComponent(bucket)}/${encodeURIComponent(filename)}`,
      {
        method: 'DELETE',
        ...options,
      }
    );
  }

  /**
   * Lists files stored in Storage buckets.
   */
  async list(bucket?: string, search?: string, options: SendOptions = {}): Promise<any> {
    const query: Record<string, any> = { ...(options.query || {}) };
    if (bucket) query.bucket = bucket;
    if (search) query.search = search;
    return this.client.send('/api/storage', {
      method: 'GET',
      ...options,
      query,
    });
  }
}

export { FileService as StorageService };
