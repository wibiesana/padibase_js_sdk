import { BaseService } from './BaseService.js';
import type { RecordModel, ListResult, RecordListOptions, RecordFullListOptions, RecordOptions, SendOptions, RecordAuthResponse, RealtimeCallback, CommonQueryParams, BatchDeleteResult } from '../types.js';
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
     * Returns the first record matching the query criteria.
     */
    getFirst(options?: RecordOptions): Promise<T>;
    /**
     * Helper that retrieves the first record matching a filter string (PocketBase style).
     *
     * @example
     * ```ts
     * const user = await padi.table('users').getFirstListItem('email = "alex@test.com"');
     * ```
     */
    getFirstListItem(filter: string, options?: RecordOptions): Promise<T>;
    /**
     * Returns the total count of records matching the optional filter.
     *
     * @example
     * ```ts
     * const count = await padi.table('orders').getCount({ filter: 'status = "completed"' });
     * ```
     */
    getCount(options?: CommonQueryParams): Promise<number>;
    /**
     * Returns a single record by its ID.
     */
    getOne(id: string, options?: RecordOptions): Promise<T>;
    /**
     * Creates a new record. Supports plain object or FormData (for direct file uploads).
     */
    create(body: FormData | Record<string, any>, options?: RecordOptions): Promise<T>;
    /**
     * Creates multiple records in a single batch operation.
     *
     * @example
     * ```ts
     * const created = await padi.table('tags').createBatch([
     *   { name: 'Rust' },
     *   { name: 'TypeScript' }
     * ]);
     * ```
     */
    createBatch(items: Array<Record<string, any>>, options?: RecordOptions): Promise<T[]>;
    /**
     * Updates an existing record by ID.
     */
    update(id: string, body: FormData | Record<string, any>, options?: RecordOptions): Promise<T>;
    /**
     * Deletes a record by ID.
     */
    delete(id: string, options?: SendOptions): Promise<boolean>;
    /**
     * Deletes multiple records by their IDs in a single batch.
     *
     * @example
     * ```ts
     * const res = await padi.table('logs').deleteBatch(['id_1', 'id_2']);
     * console.log(`Deleted ${res.deleted} records`);
     * ```
     */
    deleteBatch(ids: string[], options?: SendOptions): Promise<BatchDeleteResult>;
    /**
     * Exports records from this collection as JSON.
     */
    export(options?: CommonQueryParams): Promise<any>;
    /**
     * Imports an array of records into this collection.
     */
    import(items: Array<Record<string, any>>, options?: SendOptions): Promise<any>;
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
     * Updates the current logged in user profile.
     */
    updateProfile(data: Record<string, any>, options?: SendOptions): Promise<T>;
    /**
     * Refreshes the authentication token and user record.
     */
    authRefresh(options?: SendOptions): Promise<RecordAuthResponse<T>>;
    /**
     * Sends a password reset request email for an account in this collection.
     */
    requestPasswordReset(email: string, options?: SendOptions): Promise<any>;
    /**
     * Confirms password reset using token and sets a new password.
     */
    confirmPasswordReset(token: string, password: string, passwordConfirm?: string, options?: SendOptions): Promise<any>;
    /**
     * Requests an email verification message for an account in this collection.
     */
    requestVerification(email: string, options?: SendOptions): Promise<any>;
    /**
     * Confirms user email verification using token.
     */
    confirmVerification(token: string, options?: SendOptions): Promise<any>;
    /**
     * Changes the password for the current authenticated user in this collection.
     */
    changePassword(oldPassword: string, newPassword: string, passwordConfirm?: string, options?: SendOptions): Promise<any>;
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