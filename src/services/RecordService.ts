import { BaseService } from './BaseService.js';
import type {
  RecordModel,
  ListResult,
  RecordListOptions,
  RecordFullListOptions,
  RecordOptions,
  SendOptions,
  RecordAuthResponse,
  RealtimeCallback,
  CommonQueryParams,
  CountResult,
  BatchDeleteResult,
} from '../types.js';

export class RecordService<T = RecordModel> extends BaseService {
  readonly tableName: string;

  constructor(client: any, tableName: string) {
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
  async getList(
    page: number = 1,
    perPage: number = 30,
    options: RecordListOptions = {}
  ): Promise<ListResult<T>> {
    return this.client.send<ListResult<T>>(`/api/${encodeURIComponent(this.tableName)}`, {
      method: 'GET',
      query: { page, perPage, ...options },
      ...options,
    });
  }

  /**
   * Returns all records without pagination (PadiBase high-performance List All).
   * Backend automatically eager-loads configured relations and applies resource projections.
   */
  async getFullList(options: RecordFullListOptions = {}): Promise<T[]> {
    return this.client.send<T[]>(`/api/${encodeURIComponent(this.tableName)}/all`, {
      method: 'GET',
      query: options,
      ...options,
    });
  }

  /**
   * Alias for getFullList
   */
  async getAll(options: RecordFullListOptions = {}): Promise<T[]> {
    return this.getFullList(options);
  }

  /**
   * Returns the first record matching the query criteria.
   */
  async getFirst(options: RecordOptions = {}): Promise<T> {
    return this.client.send<T>(`/api/${encodeURIComponent(this.tableName)}/first`, {
      method: 'GET',
      query: options,
      ...options,
    });
  }

  /**
   * Helper that retrieves the first record matching a filter string (PocketBase style).
   *
   * @example
   * ```ts
   * const user = await padi.table('users').getFirstListItem('email = "alex@test.com"');
   * ```
   */
  async getFirstListItem(filter: string, options: RecordOptions = {}): Promise<T> {
    return this.getFirst({ ...options, filter });
  }

  /**
   * Returns the total count of records matching the optional filter.
   *
   * @example
   * ```ts
   * const count = await padi.table('orders').getCount({ filter: 'status = "completed"' });
   * ```
   */
  async getCount(options: CommonQueryParams = {}): Promise<number> {
    const res = await this.client.send<CountResult>(`/api/${encodeURIComponent(this.tableName)}/count`, {
      method: 'GET',
      query: options,
    });
    return (res && typeof res.count === 'number') ? res.count : (res?.total || 0);
  }

  /**
   * Returns a single record by its ID.
   */
  async getOne(id: string, options: RecordOptions = {}): Promise<T> {
    return this.client.send<T>(`/api/${encodeURIComponent(this.tableName)}/${encodeURIComponent(id)}`, {
      method: 'GET',
      query: options,
      ...options,
    });
  }

  /**
   * Creates a new record. Supports plain object or FormData (for direct file uploads).
   */
  async create(body: FormData | Record<string, any>, options: RecordOptions = {}): Promise<T> {
    return this.client.send<T>(`/api/${encodeURIComponent(this.tableName)}`, {
      method: 'POST',
      body,
      query: options,
      ...options,
    });
  }

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
  async createBatch(items: Array<Record<string, any>>, options: RecordOptions = {}): Promise<T[]> {
    return this.client.send<T[]>(`/api/${encodeURIComponent(this.tableName)}/batch-create`, {
      method: 'POST',
      body: { items },
      query: options,
      ...options,
    });
  }

  /**
   * Updates an existing record by ID.
   */
  async update(id: string, body: FormData | Record<string, any>, options: RecordOptions = {}): Promise<T> {
    return this.client.send<T>(`/api/${encodeURIComponent(this.tableName)}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body,
      query: options,
      ...options,
    });
  }

  /**
   * Deletes a record by ID.
   */
  async delete(id: string, options: SendOptions = {}): Promise<boolean> {
    await this.client.send(`/api/${encodeURIComponent(this.tableName)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      ...options,
    });
    return true;
  }

  /**
   * Deletes multiple records by their IDs in a single batch.
   *
   * @example
   * ```ts
   * const res = await padi.table('logs').deleteBatch(['id_1', 'id_2']);
   * console.log(`Deleted ${res.deleted} records`);
   * ```
   */
  async deleteBatch(ids: string[], options: SendOptions = {}): Promise<BatchDeleteResult> {
    return this.client.send<BatchDeleteResult>(`/api/${encodeURIComponent(this.tableName)}/batch-delete`, {
      method: 'POST',
      body: { ids },
      ...options,
    });
  }

  /**
   * Exports records from this collection as JSON.
   */
  async export(options: CommonQueryParams = {}): Promise<any> {
    return this.client.send(`/api/${encodeURIComponent(this.tableName)}/export`, {
      method: 'GET',
      query: options,
    });
  }

  /**
   * Imports an array of records into this collection.
   */
  async import(items: Array<Record<string, any>>, options: SendOptions = {}): Promise<any> {
    return this.client.send(`/api/${encodeURIComponent(this.tableName)}/import`, {
      method: 'POST',
      body: { items },
      ...options,
    });
  }

  // ==========================================
  // Auth Table Methods
  // ==========================================

  /**
   * Authenticates a user by email/username and password.
   * Token & record are automatically saved to client.authStore.
   */
  async authWithPassword(
    identity: string,
    password: string,
    options: SendOptions = {}
  ): Promise<RecordAuthResponse<T>> {
    const res = await this.client.send<RecordAuthResponse<T>>(
      `/api/${encodeURIComponent(this.tableName)}/login`,
      {
        method: 'POST',
        body: {
          identity,
          email: identity,
          username: identity,
          password,
        },
        ...options,
      }
    );

    if (res && res.token) {
      this.client.authStore.save(res.token, res.record);
    }

    return res;
  }

  /**
   * Registers a new user account.
   */
  async register(
    data: Record<string, any>,
    options: SendOptions = {}
  ): Promise<RecordAuthResponse<T> | T> {
    const res = await this.client.send<any>(
      `/api/${encodeURIComponent(this.tableName)}/register`,
      {
        method: 'POST',
        body: data,
        ...options,
      }
    );

    if (res && res.token && res.record) {
      this.client.authStore.save(res.token, res.record);
    }

    return res;
  }

  /**
   * Retrieves the current logged in user profile.
   */
  async getProfile(options: SendOptions = {}): Promise<T> {
    const res = await this.client.send<any>(
      `/api/${encodeURIComponent(this.tableName)}/me`,
      {
        method: 'GET',
        ...options,
      }
    );
    return res.record || res;
  }

  /**
   * Updates the current logged in user profile.
   */
  async updateProfile(data: Record<string, any>, options: SendOptions = {}): Promise<T> {
    const res = await this.client.send<any>(
      `/api/${encodeURIComponent(this.tableName)}/me`,
      {
        method: 'PATCH',
        body: data,
        ...options,
      }
    );
    const updated = res.record || res;
    if (this.client.authStore.isValid && updated) {
      this.client.authStore.save(this.client.authStore.token, updated);
    }
    return updated;
  }

  /**
   * Refreshes the authentication token and user record.
   */
  async authRefresh(options: SendOptions = {}): Promise<RecordAuthResponse<T>> {
    const res = await this.client.send<RecordAuthResponse<T>>(
      `/api/${encodeURIComponent(this.tableName)}/auth-refresh`,
      {
        method: 'POST',
        ...options,
      }
    );

    if (res && res.token) {
      this.client.authStore.save(res.token, res.record);
    }

    return res;
  }

  /**
   * Sends a password reset request email for an account in this collection.
   */
  async requestPasswordReset(email: string, options: SendOptions = {}): Promise<any> {
    return this.client.send(`/api/${encodeURIComponent(this.tableName)}/request-password-reset`, {
      method: 'POST',
      body: { email, identity: email },
      ...options,
    });
  }

  /**
   * Confirms password reset using token and sets a new password.
   */
  async confirmPasswordReset(
    token: string,
    password: string,
    passwordConfirm?: string,
    options: SendOptions = {}
  ): Promise<any> {
    return this.client.send(`/api/${encodeURIComponent(this.tableName)}/confirm-password-reset`, {
      method: 'POST',
      body: {
        token,
        password,
        newPassword: password,
        passwordConfirm: passwordConfirm || password,
      },
      ...options,
    });
  }

  /**
   * Requests an email verification message for an account in this collection.
   */
  async requestVerification(email: string, options: SendOptions = {}): Promise<any> {
    return this.client.send(`/api/${encodeURIComponent(this.tableName)}/request-verification`, {
      method: 'POST',
      body: { email, identity: email },
      ...options,
    });
  }

  /**
   * Confirms user email verification using token.
   */
  async confirmVerification(token: string, options: SendOptions = {}): Promise<any> {
    return this.client.send(`/api/${encodeURIComponent(this.tableName)}/confirm-verification`, {
      method: 'POST',
      body: { token },
      ...options,
    });
  }

  /**
   * Changes the password for the current authenticated user in this collection.
   */
  async changePassword(
    oldPassword: string,
    newPassword: string,
    passwordConfirm?: string,
    options: SendOptions = {}
  ): Promise<any> {
    return this.client.send(`/api/${encodeURIComponent(this.tableName)}/change-password`, {
      method: 'POST',
      body: {
        oldPassword,
        newPassword,
        passwordConfirm: passwordConfirm || newPassword,
      },
      ...options,
    });
  }

  /**
   * Logs out the user and clears client authStore.
   */
  async logout(options: SendOptions = {}): Promise<void> {
    try {
      await this.client.send(
        `/api/${encodeURIComponent(this.tableName)}/logout`,
        {
          method: 'POST',
          ...options,
        }
      );
    } catch {
      // Best effort
    } finally {
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
  subscribe(topic: string = '*', callback: RealtimeCallback<T>): () => void {
    let subTopic = this.tableName;
    if (topic && topic !== '*') {
      subTopic = `${this.tableName}/${topic}`;
    }
    return this.client.realtime.subscribe(subTopic, callback);
  }

  /**
   * Unsubscribes from realtime events for this table.
   */
  unsubscribe(topic?: string, callback?: RealtimeCallback<T>): void {
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
