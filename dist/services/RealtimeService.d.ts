import { BaseService } from './BaseService.js';
import type { RealtimeCallback } from '../types.js';
export type ResyncCallback = () => void;
export declare class RealtimeService extends BaseService {
    private sseClient;
    private subscriptions;
    private resyncListeners;
    private isAutoConnectEnabled;
    constructor(client: any);
    /**
     * Whether auto-reconnect and connection upon first subscription is enabled
     */
    get autoConnect(): boolean;
    set autoConnect(value: boolean);
    /**
     * Constructs the full realtime SSE URL with optional auth token
     */
    private buildRealtimeUrl;
    /**
     * Checks if currently connected to the realtime stream
     */
    isConnected(): boolean;
    /**
     * Manually establishes SSE connection
     */
    connect(): void;
    /**
     * Manually disconnects the SSE connection
     */
    disconnect(): void;
    /**
     * Subscribes a listener to a specific topic
     *
     * Topics supported:
     * - `*`: All records from all collections
     * - `users` or `users/*`: All events for the 'users' collection
     * - `users/record_id`: Only events for that specific record
     *
     * @returns Unsubscribe function
     */
    subscribe<T = any>(topic: string, callback: RealtimeCallback<T>): () => void;
    /**
     * Unsubscribes listeners
     *
     * - `unsubscribe()`: Removes all listeners and disconnects
     * - `unsubscribe(topic)`: Removes all listeners for given topic
     * - `unsubscribe(topic, callback)`: Removes a single listener function
     */
    unsubscribe(topic?: string, callback?: RealtimeCallback<any>): void;
    /**
     * Registers a callback triggered when server reports a lagged consumer
     * (meaning some events were missed and a resync/refetch is advised).
     */
    onResync(callback: ResyncCallback): () => void;
    private normalizeTopic;
    private handleMessage;
}
//# sourceMappingURL=RealtimeService.d.ts.map