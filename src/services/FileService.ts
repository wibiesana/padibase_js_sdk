import { BaseService } from './BaseService.js';
import type { SendOptions } from '../types.js';

export class FileService extends BaseService {
  /**
   * Constructs the absolute URL to access a stored file.
   *
   * @param table Table name or record object
   * @param recordId Record ID or filename if first arg is record
   * @param filename Filename
   * @param query Optional query parameters
   */
  getUrl(
    table: string | { table?: string; id?: string },
    recordId?: string,
    filename?: string,
    query?: Record<string, any>
  ): string {
    let tblName = '';
    let recId = '';
    let fName = '';

    if (typeof table === 'object' && table !== null) {
      tblName = table.table || '';
      recId = table.id || '';
      fName = recordId || '';
    } else {
      tblName = table;
      recId = recordId || '';
      fName = filename || '';
    }

    const path = `/api/files/${encodeURIComponent(tblName)}/${encodeURIComponent(recId)}/${encodeURIComponent(fName)}`;
    return this.client.buildUrl(path, query);
  }

  /**
   * Uploads a file for a specific record in a table.
   */
  async upload(
    table: string,
    recordId: string,
    file: any,
    fieldName: string = 'file',
    options: SendOptions = {}
  ): Promise<any> {
    let body: any;

    if (typeof FormData !== 'undefined' && file instanceof FormData) {
      body = file;
    } else if (typeof FormData !== 'undefined') {
      body = new FormData();
      body.append(fieldName, file);
    } else {
      body = file;
    }

    return this.client.send(
      `/api/files/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`,
      {
        method: 'POST',
        body,
        ...options,
      }
    );
  }
}
