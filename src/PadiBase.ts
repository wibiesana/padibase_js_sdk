import { BaseAuthStore } from './stores/BaseAuthStore.js';
import { LocalAuthStore } from './stores/LocalAuthStore.js';
import { ClientResponseError } from './ClientResponseError.js';
import { buildUrl } from './utils/url.js';
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
export class PadiBase {
  baseUrl: string;
  authStore: BaseAuthStore;
  customFetch?: typeof fetch;

  readonly files: FileService;
  readonly realtime: RealtimeService;

  private recordServices: Map<string, RecordService<any>> = new Map();

  constructor(baseUrl: string = 'http://127.0.0.1:8085', config: PadiBaseConfig = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.authStore = config.authStore || new LocalAuthStore();
    this.customFetch = config.customFetch;

    this.files = new FileService(this);
    this.realtime = new RealtimeService(this);

    if (config.autoRealtime !== undefined) {
      this.realtime.autoConnect = config.autoRealtime;
    }
  }

  /**
   * Returns a cached or new RecordService for the specified table.
   *
   * @param name Table name (e.g. 'users', 'posts', 'siswa')
   */
  table<T = RecordModel>(name: string): RecordService<T> {
    const cleanName = (name || '').trim();
    if (!this.recordServices.has(cleanName)) {
      this.recordServices.set(cleanName, new RecordService<T>(this, cleanName));
    }
    return this.recordServices.get(cleanName)!;
  }

  /**
   * Alias for table(name)
   */
  from<T = RecordModel>(name: string): RecordService<T> {
    return this.table<T>(name);
  }

  /**
   * Builds absolute URL with optional query parameters
   */
  buildUrl(path: string = '', query?: Record<string, any>): string {
    return buildUrl(this.baseUrl, path, query);
  }

  /**
   * Checks backend health
   */
  async health(): Promise<{ status: string; [key: string]: any }> {
    return this.get('/api/health');
  }

  // ==========================================
  // Direct HTTP Methods
  // ==========================================

  /**
   * Sends a GET request
   */
  async get<T = any>(path: string, options: SendOptions = {}): Promise<T> {
    return this.send<T>(path, { ...options, method: 'GET' });
  }

  /**
   * Sends a POST request
   */
  async post<T = any>(path: string, body?: any, options: SendOptions = {}): Promise<T> {
    return this.send<T>(path, { ...options, method: 'POST', body });
  }

  /**
   * Sends a PUT request
   */
  async put<T = any>(path: string, body?: any, options: SendOptions = {}): Promise<T> {
    return this.send<T>(path, { ...options, method: 'PUT', body });
  }

  /**
   * Sends a PATCH request
   */
  async patch<T = any>(path: string, body?: any, options: SendOptions = {}): Promise<T> {
    return this.send<T>(path, { ...options, method: 'PATCH', body });
  }

  /**
   * Sends a DELETE request
   */
  async delete<T = any>(path: string, options: SendOptions = {}): Promise<T> {
    return this.send<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Centralized HTTP request dispatcher
   */
  async send<T = any>(path: string, options: SendOptions = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const query = options.query || options.params;
    const url = this.buildUrl(path, query);

    const headers: Record<string, string> = {
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

    let response: Response;
    try {
      response = await fetchFunc(url, {
        method,
        headers,
        body,
        signal: options.signal,
      });
    } catch (err: any) {
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
      return null as any;
    }

    const contentType = response.headers.get('content-type') || '';
    let responseData: any;

    try {
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (parseErr) {
      responseData = null;
    }

    if (!response.ok) {
      throw new ClientResponseError({
        url,
        status: response.status,
        response: responseData,
        data: responseData,
        message:
          (responseData && typeof responseData === 'object' && responseData.message) ||
          `Failed request with status ${response.status}`,
      });
    }

    return responseData as T;
  }
}
