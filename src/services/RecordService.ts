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
