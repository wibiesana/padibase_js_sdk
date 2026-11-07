/**
 * Base in-memory AuthStore implementation
 */
export type OnStoreChangeFunc = (token: string, record: any) => void;
export declare class BaseAuthStore {
    protected _token: string;
    protected _record: any;
    private _listeners;
    constructor();
    get token(): string;
    get record(): any;
    /**
     * Alias for record to match PocketBase conventions
     */
    get model(): any;
    get isValid(): boolean;
    /**
     * Saves authentication token and associated user record
     */
    save(token: string, record: any): void;
    /**
     * Clears the current auth state
     */
    clear(): void;
    /**
     * Subscribes to auth store state changes
     * @returns Unsubscribe function
     */
    onChange(callback: OnStoreChangeFunc): () => void;
    protected triggerChange(): void;
    /**
     * Parses JWT payload without external dependencies
     */
    getParsedJwt(token: string): Record<string, any> | null;
}
//# sourceMappingURL=BaseAuthStore.d.ts.map