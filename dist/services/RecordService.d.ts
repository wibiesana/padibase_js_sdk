import { BaseService } from './BaseService.js';
import type { RecordModel, ListResult, RecordListOptions, RecordFullListOptions, RecordOptions, SendOptions, RecordAuthResponse, RealtimeCallback } from '../types.js';
export declare class RecordService<T = RecordModel> extends BaseService {
    readonly tableName: string;
    constructor(client: any, tableName: string);
    /**
     * Returns a paginated records list.
     *
     * @param page Page number (1-based, default 1)
     * @param perPage Number of records per page (default 30)
     * @param options Query filters or sorting (relations & projections are handled by backend settings)
     */
    getList(page?: number, perPage?: number, options?: RecordListOptions): Promise<ListResult<T>>;
    /**
     * Returns all records without pagination (PadiBase high-performance List All).
     * Backend automatically eager-loads configured relations and applies resource projections.
     */
    getFullList(options?: RecordFullListOptions): Promise<T[]>;
    /**
     * Alias for getFullList
     */
    getAll(options?: RecordFullListOptions): Promise<T[]>;
    /**
     * Returns a single record by its ID.
     */
    getOne(id: string, options?: RecordOptions): Promise<T>;
    /**
     * Creates a new record. Supports plain object or FormData (for direct file uploads).
     */
    create(body: FormData | Record<string, any>, options?: RecordOptions): Promise<T>;
    /**
     * Updates an existing record by ID.
     */
    update(id: string, body: FormData | Record<string, any>, options?: RecordOptions): Promise<T>;
    /**
     * Deletes a record by ID.
     */
    delete(id: string, options?: SendOptions): Promise<boolean>;
    /**
     * Authenticates a user by email/username and password.
     * Token & record are automatically saved to client.authStore.
     */
    authWithPassword(identity: string, password: string, options?: SendOptions): Promise<RecordAuthResponse<T>>;
    /**
     * Registers a new user account.
     */
    register(data: Record<string, any>, options?: SendOptions): Promise<RecordAuthResponse<T> | T>;
    /**
     * Retrieves the current logged in user profile.
     */
    getProfile(options?: SendOptions): Promise<T>;
    /**
     * Logs out the user and clears client authStore.
     */
    logout(options?: SendOptions): Promise<void>;
    /**
     * Subscribes to realtime events for this table.
     *
     * @param topic `'*'` for all records in this table, or a specific `recordId`
     * @param callback Handler receiving `{ action, table, record }`
     * @returns Unsubscribe function
     */
    subscribe(topic: string | undefined, callback: RealtimeCallback<T>): () => void;
    /**
     * Unsubscribes from realtime events for this table.
     */
    unsubscribe(topic?: string, callback?: RealtimeCallback<T>): void;
}
//# sourceMappingURL=RecordService.d.ts.map