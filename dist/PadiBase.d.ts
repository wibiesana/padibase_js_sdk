import { BaseAuthStore } from './stores/BaseAuthStore.js';
import { RecordService } from './services/RecordService.js';
import { FileService } from './services/FileService.js';
import { RealtimeService } from './services/RealtimeService.js';
import type { SendOptions, RecordModel } from './types.js';
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
 * // Realtime auto-subscriptions
 * padi.table('posts').subscribe('*', (e) => {
 *   console.log(e.action, e.record);
 * });
 *
 * // Direct HTTP Methods
 * const data = await padi.get('/api/health');
 * const res = await padi.post('/api/posts', { title: 'Hello' });
 * ```
 */
export declare class PadiBase {
    baseUrl: string;
    authStore: BaseAuthStore;
    customFetch?: typeof fetch;
    readonly files: FileService;
    readonly realtime: RealtimeService;
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