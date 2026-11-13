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
export declare class FileService extends BaseService {
    /**
     * Constructs the absolute URL to access a stored file in Storage.
     *
     * Supports:
     * - `getUrl('/api/storage/avatars/photo.png')`
     * - `getUrl('avatars', 'photo.png', { download: 1 })`
     * - Legacy: `getUrl('users', 'rec_1', 'avatar.png', { thumb: '100x100' })`
     */
    getUrl(bucketOrTable: string | {
        table?: string;
        id?: string;
    }, filenameOrRecordId?: string | Record<string, any>, filenameOrQuery?: string | Record<string, any>, query?: Record<string, any>): string;
    /**
     * Uploads a file to a Storage bucket and returns its URL & metadata so you can save the link in any table column.
     *
     * @example
     * ```js
     * const uploaded = await padi.storage.upload('avatars', fileInput.files[0]);
     * await padi.table('users').update(userId, { avatar_url: uploaded.url });
     * ```
     */
    upload(bucket: string, fileOrRecordId: any, optionsOrFile?: SendOptions | any, legacyFieldName?: string, legacyOptions?: SendOptions): Promise<StorageUploadResult>;
    /**
     * Deletes a file from a Storage bucket.
     */
    delete(bucket: string, filename: string, options?: SendOptions): Promise<any>;
    /**
     * Lists files stored in Storage buckets.
     */
    list(bucket?: string, search?: string, options?: SendOptions): Promise<any>;
}
export { FileService as StorageService };
//# sourceMappingURL=FileService.d.ts.map