import { BaseAuthStore } from './stores/BaseAuthStore.js';
import { RecordService } from './services/RecordService.js';
import { FileService } from './services/FileService.js';
import { RealtimeService } from './services/RealtimeService.js';
import { AuthService } from './services/AuthService.js';
import { AdminService } from './services/AdminService.js';
import { CollectionService } from './services/CollectionService.js';
import type { SendOptions, RecordModel, TransactionOperation, TransactionResult } from './types.js';
export interface PadiBaseConfig {
    authStore?: BaseAuthStore;
    autoRealtime?: boolean;
    customFetch?: typeof fetch;
}
/**
 * PadiBase Client - High-performance BaaS SDK
 *
 * @example
 * ```ts
 * import PadiBase from 'padibase';
 *
 * const padi = new PadiBase('http://127.0.0.1:8085');
 *
 * // Table CRUD
 * const posts = await padi.table('posts').getList(1, 20);
 *
 * // Direct Auth shortcut
 * await padi.auth.login('user@example.com', 'password123');
 *
 * // Realtime auto-subscriptions
 * padi.table('posts').subscribe('*', (e) => {
 *   console.log(e.action, e.record);
 * });
 *
 * // Direct HTTP Methods
 * const data = await padi.get('/api/health');
 * const res = await padi.post('/api/posts', { title: 'Hello' });
 *
 * // Atomic Database Batch / Transactions
 * await padi.transaction([
 *   { action: 'create', collection: 'posts', data: { title: 'First' } },
 *   { action: 'create', collection: 'posts', data: { title: 'Second' } }
 * ]);
 * ```
 */
export declare class PadiBase {
    baseUrl: string;
    authStore: BaseAuthStore;
    customFetch?: typeof fetch;
    readonly storage: FileService;
    readonly files: FileService;
    readonly realtime: RealtimeService;
    readonly auth: AuthService;
    readonly admins: AdminService;
    readonly collections: CollectionService;
    readonly tables: CollectionService;
    private recordServices;
    constructor(baseUrl?: string, config?: PadiBaseConfig);
    /**
     * Returns a cached or new RecordService for the specified table.
     *
     * @param name Table name (e.g. 'users', 'posts', 'siswa')
     */
    table<T = RecordModel>(name: string): RecordService<T>;
    /**
     * Alias for table(name)
     */
    from<T = RecordModel>(name: string): RecordService<T>;
    /**
     * Builds absolute URL with optional query parameters
     */
    buildUrl(path?: string, query?: Record<string, any>): string;
    /**
     * Checks backend health
     */
    health(): Promise<{
        status: string;
        [key: string]: any;
    }>;
    /**
     * Executes multiple operations atomically inside a single DB transaction.
     * If any step fails, the entire batch rolls back.
     *
     * @example
     * ```ts
     * const res = await padi.transaction([
     *   { action: 'create', collection: 'posts', data: { title: 'First' } },
     *   { action: 'update', collection: 'users', id: 'u_1', data: { score: 100 } }
     * ]);
     * ```
     */
    transaction(operations: TransactionOperation[], options?: SendOptions): Promise<TransactionResult>;
    /**
     * Alias for transaction()
     */
    batch(operations: TransactionOperation[], options?: SendOptions): Promise<TransactionResult>;
    /**
     * Executes a parameterized custom SQL query (Admin Superuser only).
     *
     * @example
     * ```ts
     * const res = await padi.sql('SELECT * FROM users WHERE status = ?', ['active']);
     * console.log(res.items);
     * ```
     */
    sql<T = any>(query: string, params?: any[] | Record<string, any>, options?: SendOptions): Promise<{
        items: T[];
        totalItems: number;
        [key: string]: any;
    }>;
    /**
     * Calls a dynamic custom SQL endpoint configured in PadiBase dashboard (`/api/custom/{*path}`).
     *
     * @example
     * ```ts
     * const stats = await padi.custom('stats/dashboard', { method: 'GET' });
     * ```
     */
    custom<T = any>(endpointPath: string, options?: SendOptions): Promise<T>;
    /**
     * Alias for custom()
     */
    endpoint<T = any>(endpointPath: string, options?: SendOptions): Promise<T>;
    /**
     * Sends a GET request
     */
    get<T = any>(path: string, options?: SendOptions): Promise<T>;
    /**
     * Sends a POST request
     */
    post<T = any>(path: string, body?: any, options?: SendOptions): Promise<T>;
    /**
     * Sends a PUT request
     */
    put<T = any>(path: string, body?: any, options?: SendOptions): Promise<T>;
    /**
     * Sends a PATCH request
     */
    patch<T = any>(path: string, body?: any, options?: SendOptions): Promise<T>;
    /**
     * Sends a DELETE request
     */
    delete<T = any>(path: string, options?: SendOptions): Promise<T>;
    /**
     * Centralized HTTP request dispatcher
     */
    send<T = any>(path: string, options?: SendOptions): Promise<T>;
}
//# sourceMappingURL=PadiBase.d.ts.map