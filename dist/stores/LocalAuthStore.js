import { BaseAuthStore } from './BaseAuthStore.js';
/**
 * LocalAuthStore persists auth data to browser localStorage (or any custom storage key).
 * Falls back seamlessly to in-memory store in environments without localStorage (Node.js/SSR).
 */
export class LocalAuthStore extends BaseAuthStore {
    storageKey;
    constructor(storageKey = 'padibase_auth') {
        super();
        this.storageKey = storageKey;
        this.loadFromStorage();
    }
    isStorageAvailable() {
        try {
            return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
        }
        catch {
            return false;
        }
    }
    loadFromStorage() {
        if (!this.isStorageAvailable())
            return;
        try {
            const raw = window.localStorage.getItem(this.storageKey);
            if (!raw)
                return;
            const data = JSON.parse(raw);
            if (data && typeof data === 'object') {
                this._token = data.token || '';
                this._record = data.record || null;
            }
        }
        catch {
            // Ignore corrupted stored data
        }
    }
    save(token, record) {
        super.save(token, record);
        if (this.isStorageAvailable()) {
            try {
                window.localStorage.setItem(this.storageKey, JSON.stringify({
                    token: this._token,
                    record: this._record,
                }));
            }
            catch (err) {
                console.warn('Failed to save auth state to localStorage:', err);
            }
        }
    }
    clear() {
        super.clear();
        if (this.isStorageAvailable()) {
            try {
                window.localStorage.removeItem(this.storageKey);
            }
            catch {
                // Ignore
            }
        }
    }
}
//# sourceMappingURL=LocalAuthStore.js.map