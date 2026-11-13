import { BaseService } from './BaseService.js';
import type { SendOptions, CollectionModel } from '../types.js';
export declare class CollectionService extends BaseService {
    /**
     * List all collections/tables in the database.
     */
    getList(options?: SendOptions): Promise<CollectionModel[]>;
    /**
     * Alias for getList
     */
    getAll(options?: SendOptions): Promise<CollectionModel[]>;
    /**
     * Get a single collection schema definition by name or ID.
     */
    getOne(nameOrId: string, options?: SendOptions): Promise<CollectionModel>;
    /**
     * Create a new collection/table.
     */
    create(data: CollectionModel | Record<string, any>, options?: SendOptions): Promise<CollectionModel>;
    /**
     * Update an existing collection schema/rules.
     */
    update(nameOrId: string, data: Partial<CollectionModel> | Record<string, any>, options?: SendOptions): Promise<CollectionModel>;
    /**
     * Rename a collection/table.
     */
    rename(nameOrId: string, newName: string, options?: SendOptions): Promise<CollectionModel>;
    /**
     * Delete a collection and drop its underlying database table.
     */
    delete(nameOrId: string, options?: SendOptions): Promise<boolean>;
    /**
     * Synchronize physical database tables with PadiBase system catalog.
     */
    sync(options?: SendOptions): Promise<any>;
    /**
     * Import collections schema definition array.
     */
    import(collections: CollectionModel[], options?: SendOptions): Promise<any>;
}
//# sourceMappingURL=CollectionService.d.ts.map