import { BaseAuthStore } from './BaseAuthStore.js';
/**
 * LocalAuthStore persists auth data to browser localStorage (or any custom storage key).
 * Falls back seamlessly to in-memory store in environments without localStorage (Node.js/SSR).
 */
export declare class LocalAuthStore extends BaseAuthStore {
    readonly storageKey: string;
    constructor(storageKey?: string);
    private isStorageAvailable;
    private loadFromStorage;
    save(token: string, record: any): void;
    clear(): void;
}
//# sourceMappingURL=LocalAuthStore.d.ts.map