import { BaseService } from './BaseService.js';
import type { SendOptions, CollectionModel } from '../types.js';

export class CollectionService extends BaseService {
  /**
   * List all collections/tables in the database.
   */
  async getList(options: SendOptions = {}): Promise<CollectionModel[]> {
    return this.client.send<CollectionModel[]>('/api/collections', {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Alias for getList
   */
  async getAll(options: SendOptions = {}): Promise<CollectionModel[]> {
    return this.getList(options);
  }

  /**
   * Get a single collection schema definition by name or ID.
   */
  async getOne(nameOrId: string, options: SendOptions = {}): Promise<CollectionModel> {
    return this.client.send<CollectionModel>(`/api/collections/${encodeURIComponent(nameOrId)}`, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Create a new collection/table.
   */
  async create(data: CollectionModel | Record<string, any>, options: SendOptions = {}): Promise<CollectionModel> {
    return this.client.send<CollectionModel>('/api/collections', {
      method: 'POST',
      body: data,
      ...options,
    });
  }

  /**
   * Update an existing collection schema/rules.
   */
  async update(
    nameOrId: string,
    data: Partial<CollectionModel> | Record<string, any>,
    options: SendOptions = {}
  ): Promise<CollectionModel> {
    return this.client.send<CollectionModel>(`/api/collections/${encodeURIComponent(nameOrId)}`, {
      method: 'PATCH',
      body: data,
      ...options,
    });
  }

  /**
   * Rename a collection/table.
   */
  async rename(nameOrId: string, newName: string, options: SendOptions = {}): Promise<CollectionModel> {
    return this.client.send<CollectionModel>(`/api/collections/${encodeURIComponent(nameOrId)}/rename`, {
      method: 'POST',
      body: { name: newName },
      ...options,
    });
  }

  /**
   * Delete a collection and drop its underlying database table.
   */
  async delete(nameOrId: string, options: SendOptions = {}): Promise<boolean> {
    await this.client.send(`/api/collections/${encodeURIComponent(nameOrId)}`, {
      method: 'DELETE',
      ...options,
    });
    return true;
  }

  /**
   * Synchronize physical database tables with PadiBase system catalog.
   */
  async sync(options: SendOptions = {}): Promise<any> {
    return this.client.send('/api/collections/sync', {
      method: 'POST',
      ...options,
    });
  }

  /**
   * Import collections schema definition array.
   */
  async import(collections: CollectionModel[], options: SendOptions = {}): Promise<any> {
    return this.client.send('/api/collections/import', {
      method: 'PUT',
      body: { collections },
      ...options,
    });
  }
}

