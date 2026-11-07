/**
 * Base in-memory AuthStore implementation
 */

export type OnStoreChangeFunc = (token: string, record: any) => void;

export class BaseAuthStore {
  protected _token: string = '';
  protected _record: any = null;
  private _listeners: Set<OnStoreChangeFunc> = new Set();

  constructor() {
    this._token = '';
    this._record = null;
  }

  get token(): string {
    return this._token;
  }

  get record(): any {
    return this._record;
  }

  /**
   * Alias for record to match PocketBase conventions
   */
  get model(): any {
    return this._record;
  }

  get isValid(): boolean {
    if (!this._token) {
      return false;
    }

    const payload = this.getParsedJwt(this._token);
    if (!payload || !payload.exp) {
      return true; // No expiration in token
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  /**
   * Saves authentication token and associated user record
   */
  save(token: string, record: any): void {
    this._token = token || '';
    this._record = record || null;
    this.triggerChange();
  }

  /**
   * Clears the current auth state
   */
  clear(): void {
    this._token = '';
    this._record = null;
    this.triggerChange();
  }

  /**
   * Subscribes to auth store state changes
   * @returns Unsubscribe function
   */
  onChange(callback: OnStoreChangeFunc): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }

  protected triggerChange(): void {
    for (const listener of this._listeners) {
      try {
        listener(this._token, this._record);
      } catch (err) {
        console.error('Error in AuthStore change listener:', err);
      }
    }
  }

  /**
   * Parses JWT payload without external dependencies
   */
  getParsedJwt(token: string): Record<string, any> | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }

      let jsonStr: string;
      const gBuffer = (globalThis as any).Buffer;
      if (typeof atob === 'function') {
        jsonStr = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } else if (typeof gBuffer !== 'undefined') {
        jsonStr = gBuffer.from(base64, 'base64').toString('utf8');
      } else {
        return null;
      }

      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }
}
