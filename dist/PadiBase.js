import { LocalAuthStore } from './stores/LocalAuthStore.js';
import { ClientResponseError } from './ClientResponseError.js';
import { buildUrl } from './utils/url.js';
import { RecordService } from './services/RecordService.js';
import { FileService } from './services/FileService.js';
import { RealtimeService } from './services/RealtimeService.js';
import { AuthService } from './services/AuthService.js';
import { AdminService } from './services/AdminService.js';
import { CollectionService } from './services/CollectionService.js';
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
export class PadiBase {
    baseUrl;
    authStore;
    customFetch;
    storage;
    files;
    realtime;
    auth;
    admins;
    collections;
    tables;
    recordServices = new Map();
    constructor(baseUrl = 'http://127.0.0.1:8085', config = {}) {
        this.baseUrl = baseUrl.replace(/\/+$/, '');
        this.authStore = config.authStore || new LocalAuthStore();
        this.customFetch = config.customFetch;
        this.storage = new FileService(this);
        this.files = this.storage;
        this.realtime = new RealtimeService(this);
        this.auth = new AuthService(this);
        this.admins = new AdminService(this);
        this.collections = new CollectionService(this);
        this.tables = this.collections;
        if (config.autoRealtime !== undefined) {
            this.realtime.autoConnect = config.autoRealtime;
        }
    }
    /**
     * Returns a cached or new RecordService for the specified table.
     *
     * @param name Table name (e.g. 'users', 'posts', 'siswa')
     */
    table(name) {
        const cleanName = (name || '').trim();
        if (!this.recordServices.has(cleanName)) {
            this.recordServices.set(cleanName, new RecordService(this, cleanName));
        }
        return this.recordServices.get(cleanName);
    }
    /**
     * Alias for table(name)
     */
    from(name) {
        return this.table(name);
    }
    /**
     * Builds absolute URL with optional query parameters
     */
    buildUrl(path = '', query) {
        return buildUrl(this.baseUrl, path, query);
    }
    /**
     * Checks backend health
     */
    async health() {
        return this.get('/api/health');
    }
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
    async transaction(operations, options = {}) {
        return this.send('/api/transactions', {
            method: 'POST',
            body: { operations },
            ...options,
        });
    }
    /**
     * Alias for transaction()
     */
    async batch(operations, options = {}) {
        return this.transaction(operations, options);
    }
    /**
     * Executes a parameterized custom SQL query (Admin Superuser only).
     *
     * @example
     * ```ts
     * const res = await padi.sql('SELECT * FROM users WHERE status = ?', ['active']);
     * console.log(res.items);
     * ```
     */
    async sql(query, params = [], options = {}) {
        return this.send('/api/sql', {
            method: 'POST',
            body: { sql: query, params },
            ...options,
        });
    }
    /**
     * Calls a dynamic custom SQL endpoint configured in PadiBase dashboard (`/api/custom/{*path}`).
     *
     * @example
     * ```ts
     * const stats = await padi.custom('stats/dashboard', { method: 'GET' });
     * ```
     */
    async custom(endpointPath, options = {}) {
        const cleanPath = (endpointPath || '').replace(/^\/+/, '');
        return this.send(`/api/custom/${cleanPath}`, options);
    }
    /**
     * Alias for custom()
     */
    async endpoint(endpointPath, options = {}) {
        return this.custom(endpointPath, options);
    }
    // ==========================================
    // Direct HTTP Methods
    // ==========================================
    /**
     * Sends a GET request
     */
    async get(path, options = {}) {
        return this.send(path, { ...options, method: 'GET' });
    }
    /**
     * Sends a POST request
     */
    async post(path, body, options = {}) {
        return this.send(path, { ...options, method: 'POST', body });
    }
    /**
     * Sends a PUT request
     */
    async put(path, body, options = {}) {
        return this.send(path, { ...options, method: 'PUT', body });
    }
    /**
     * Sends a PATCH request
     */
    async patch(path, body, options = {}) {
        return this.send(path, { ...options, method: 'PATCH', body });
    }
    /**
     * Sends a DELETE request
     */
    async delete(path, options = {}) {
        return this.send(path, { ...options, method: 'DELETE' });
    }
    /**
     * Centralized HTTP request dispatcher
     */
    async send(path, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        const query = options.query || options.params;
        const url = this.buildUrl(path, query);
        const headers = {
            Accept: 'application/json, text/plain, */*',
            ...(options.headers || {}),
        };
        // Attach authorization bearer header if token is available
        if (this.authStore && this.authStore.token && !headers['Authorization'] && !headers['authorization']) {
            headers['Authorization'] = `Bearer ${this.authStore.token}`;
        }
        let body = options.body;
        // Auto-serialize JSON body unless it's FormData, Blob, ArrayBuffer or URLSearchParams
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
        const isBuffer = typeof ArrayBuffer !== 'undefined' && (body instanceof ArrayBuffer || ArrayBuffer.isView(body));
        const isUrlParams = typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
        if (body !== undefined && body !== null && !isFormData && !isBlob && !isBuffer && !isUrlParams) {
            if (typeof body === 'object') {
                headers['Content-Type'] = headers['Content-Type'] || headers['content-type'] || 'application/json';
                body = JSON.stringify(body);
            }
        }
        const fetchFunc = options.fetch || this.customFetch || fetch;
        let response;
        try {
            response = await fetchFunc(url, {
                method,
                headers,
                body,
                signal: options.signal,
            });
        }
        catch (err) {
            throw new ClientResponseError({
                url,
                status: 0,
                data: {},
                isAbort: err?.name === 'AbortError',
                originalError: err,
                message: err?.message || 'Network request failed',
            });
        }
        if (response.status === 204) {
            return null;
        }
        const contentType = response.headers.get('content-type') || '';
        let responseData;
        try {
            if (contentType.includes('application/json')) {
                responseData = await response.json();
            }
            else {
                responseData = await response.text();
            }
        }
        catch (parseErr) {
            responseData = null;
        }
        if (!response.ok) {
            throw new ClientResponseError({
                url,
                status: response.status,
                response: responseData,
                data: responseData,
                message: (responseData && typeof responseData === 'object' && responseData.message) ||
                    `Failed request with status ${response.status}`,
            });
        }
        return responseData;
    }
}
//# sourceMappingURL=PadiBase.js.map