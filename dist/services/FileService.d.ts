import { BaseService } from './BaseService.js';
import type { SendOptions } from '../types.js';
export declare class FileService extends BaseService {
    /**
     * Constructs the absolute URL to access a stored file.
     *
     * @param table Table name or record object
     * @param recordId Record ID or filename if first arg is record
     * @param filename Filename
     * @param query Optional query parameters
     */
    getUrl(table: string | {
        table?: string;
        id?: string;
    }, recordId?: string, filename?: string, query?: Record<string, any>): string;
    /**
     * Uploads a file for a specific record in a table.
     */
    upload(table: string, recordId: string, file: any, fieldName?: string, options?: SendOptions): Promise<any>;
}
//# sourceMappingURL=FileService.d.ts.map