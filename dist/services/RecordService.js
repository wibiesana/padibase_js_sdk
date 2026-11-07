import { BaseService } from './BaseService.js';
export class RecordService extends BaseService {
    tableName;
    constructor(client, tableName) {
        super(client);
        this.tableName = tableName;
    }
    /**
     * Returns a paginated records list.
     *
     * @param page Page number (1-based, default 1)
     * @param perPage Number of records per page (default 30)
     * @param options Query filters or sorting (relations & projections are handled by backend settings)
     */
    async getList(page = 1, perPage = 30, options = {}) {
        return this.client.send(`/api/${encodeURIComponent(this.tableName)}`, {
            method: 'GET',
            query: { page, perPage, ...options },
            ...options,
        });
    }
    /**
     * Returns all records without pagination (PadiBase high-performance List All).
     * Backend automatically eager-loads configured relations and applies resource projections.
     */
    async getFullList(options = {}) {
        return this.client.send(`/api/${encodeURIComponent(this.tableName)}/all`, {
            method: 'GET',
            query: options,
            ...options,
        });
    }
    /**
     * Alias for getFullList
     */
    async getAll(options = {}) {
        return this.getFullList(options);
    }
    /**
     * Returns a single record by its ID.
     */
    async getOne(id, options = {}) {
        return this.client.send(`/api/${encodeURIComponent(this.tableName)}/${encodeURIComponent(id)}`, {
            method: 'GET',
            query: options,
            ...options,
        });
    }
    /**
     * Creates a new record. Supports plain object or FormData (for direct file uploads).
     */
    async create(body, options = {}) {
        return this.client.send(`/api/${encodeURIComponent(this.tableName)}`, {
            method: 'POST',
            body,
            query: options,
            ...options,
        });
    }
    /**
     * Updates an existing record by ID.
     */
    async update(id, body, options = {}) {
        return this.client.send(`/api/${encodeURIComponent(this.tableName)}/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body,
            query: options,
            ...options,
        });
    }
    /**
     * Deletes a record by ID.
     */
    async delete(id, options = {}) {
        await this.client.send(`/api/${encodeURIComponent(this.tableName)}/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            ...options,
        });
        return true;
    }
    // ==========================================
    // Auth Table Methods
    // ==========================================
    /**
     * Authenticates a user by email/username and password.
     * Token & record are automatically saved to client.authStore.
     */
    async authWithPassword(identity, password, options = {}) {
        const res = await this.client.send(`/api/${encodeURIComponent(this.tableName)}/login`, {
            method: 'POST',
            body: {
                identity,
                email: identity,
                username: identity,
                password,
            },
            ...options,
        });
        if (res && res.token) {
            this.client.authStore.save(res.token, res.record);
        }
        return res;
    }
    /**
     * Registers a new user account.
     */
    async register(data, options = {}) {
        const res = await this.client.send(`/api/${encodeURIComponent(this.tableName)}/register`, {
            method: 'POST',
            body: data,
            ...options,
        });
        if (res && res.token && res.record) {
            this.client.authStore.save(res.token, res.record);
        }
        return res;
    }
    /**
     * Retrieves the current logged in user profile.
     */
    async getProfile(options = {}) {
        const res = await this.client.send(`/api/${encodeURIComponent(this.tableName)}/me`, {
            method: 'GET',
            ...options,
        });
        return res.record || res;
    }
    /**
     * Logs out the user and clears client authStore.
     */
    async logout(options = {}) {
        try {
            await this.client.send(`/api/${encodeURIComponent(this.tableName)}/logout`, {
                method: 'POST',
                ...options,
            });
        }
        catch {
            // Best effort
        }
        finally {
            this.client.authStore.clear();
        }
    }
    // ==========================================
    // Realtime Subscriptions on Table
    // ==========================================
    /**
     * Subscribes to realtime events for this table.
     *
     * @param topic `'*'` for all records in this table, or a specific `recordId`
     * @param callback Handler receiving `{ action, table, record }`
     * @returns Unsubscribe function
     */
    subscribe(topic = '*', callback) {
        let subTopic = this.tableName;
        if (topic && topic !== '*') {
            subTopic = `${this.tableName}/${topic}`;
        }
        return this.client.realtime.subscribe(subTopic, callback);
    }
    /**
     * Unsubscribes from realtime events for this table.
     */
    unsubscribe(topic, callback) {
        if (!topic) {
            this.client.realtime.unsubscribe(this.tableName);
            return;
        }
        let subTopic = this.tableName;
        if (topic !== '*') {
            subTopic = `${this.tableName}/${topic}`;
        }
        this.client.realtime.unsubscribe(subTopic, callback);
    }
}
//# sourceMappingURL=RecordService.js.map