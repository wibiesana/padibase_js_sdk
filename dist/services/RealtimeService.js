import { BaseService } from './BaseService.js';
import { UniversalSSEClient } from '../utils/sse.js';
export class RealtimeService extends BaseService {
    sseClient = null;
    subscriptions = new Map();
    resyncListeners = new Set();
    isAutoConnectEnabled = true;
    constructor(client) {
        super(client);
        // Watch authStore changes to update SSE token dynamically
        if (this.client.authStore) {
            this.client.authStore.onChange((token) => {
                if (this.sseClient && this.sseClient.isConnected()) {
                    this.sseClient.setUrl(this.buildRealtimeUrl(token));
                }
            });
        }
    }
    /**
     * Whether auto-reconnect and connection upon first subscription is enabled
     */
    get autoConnect() {
        return this.isAutoConnectEnabled;
    }
    set autoConnect(value) {
        this.isAutoConnectEnabled = value;
    }
    /**
     * Constructs the full realtime SSE URL with optional auth token
     */
    buildRealtimeUrl(token) {
        const activeToken = token ?? this.client.authStore.token;
        let url = this.client.buildUrl('/api/realtime');
        if (activeToken) {
            url += (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(activeToken);
        }
        return url;
    }
    /**
     * Checks if currently connected to the realtime stream
     */
    isConnected() {
        return this.sseClient ? this.sseClient.isConnected() : false;
    }
    /**
     * Manually establishes SSE connection
     */
    connect() {
        if (!this.sseClient) {
            const url = this.buildRealtimeUrl();
            this.sseClient = new UniversalSSEClient(url);
            this.sseClient.onMessage = (msg) => {
                this.handleMessage(msg);
            };
            this.sseClient.onStatusChange = (status, err) => {
                // Dispatched if consumers want to listen
            };
        }
        this.sseClient.connect();
    }
    /**
     * Manually disconnects the SSE connection
     */
    disconnect() {
        if (this.sseClient) {
            this.sseClient.disconnect();
        }
    }
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
    subscribe(topic, callback) {
        const normalizedTopic = this.normalizeTopic(topic);
        if (!this.subscriptions.has(normalizedTopic)) {
            this.subscriptions.set(normalizedTopic, new Set());
        }
        this.subscriptions.get(normalizedTopic).add(callback);
        // Auto-connect when first listener added
        if (this.isAutoConnectEnabled && !this.isConnected()) {
            this.connect();
        }
        return () => {
            this.unsubscribe(normalizedTopic, callback);
        };
    }
    /**
     * Unsubscribes listeners
     *
     * - `unsubscribe()`: Removes all listeners and disconnects
     * - `unsubscribe(topic)`: Removes all listeners for given topic
     * - `unsubscribe(topic, callback)`: Removes a single listener function
     */
    unsubscribe(topic, callback) {
        if (!topic) {
            // Clear all
            this.subscriptions.clear();
            this.disconnect();
            return;
        }
        const normalizedTopic = this.normalizeTopic(topic);
        const listeners = this.subscriptions.get(normalizedTopic);
        if (!listeners)
            return;
        if (callback) {
            listeners.delete(callback);
            if (listeners.size === 0) {
                this.subscriptions.delete(normalizedTopic);
            }
        }
        else {
            this.subscriptions.delete(normalizedTopic);
        }
        // If no more subscriptions remain, disconnect
        if (this.subscriptions.size === 0 && this.isAutoConnectEnabled) {
            this.disconnect();
        }
    }
    /**
     * Registers a callback triggered when server reports a lagged consumer
     * (meaning some events were missed and a resync/refetch is advised).
     */
    onResync(callback) {
        this.resyncListeners.add(callback);
        return () => {
            this.resyncListeners.delete(callback);
        };
    }
    normalizeTopic(topic) {
        let t = (topic || '*').trim();
        if (t.endsWith('/*')) {
            t = t.substring(0, t.length - 2);
        }
        return t;
    }
    handleMessage(msg) {
        // Check if lagged event
        if (msg.event === 'lagged' || msg.data === 'resync') {
            for (const listener of this.resyncListeners) {
                try {
                    listener();
                }
                catch (e) {
                    console.error('Error in resync listener:', e);
                }
            }
            return;
        }
        if (!msg.data)
            return;
        let parsed;
        try {
            parsed = JSON.parse(msg.data);
        }
        catch {
            return;
        }
        const table = parsed.table || parsed.collection || '';
        const recordId = parsed.record && typeof parsed.record === 'object' ? String(parsed.record.id || '') : '';
        // Collect matching topics:
        // 1. Wildcard '*'
        // 2. Collection wildcard 'table' or 'table/*'
        // 3. Record-specific 'table/record_id'
        const matchingTopics = new Set();
        matchingTopics.add('*');
        if (table) {
            matchingTopics.add(table);
            if (recordId) {
                matchingTopics.add(`${table}/${recordId}`);
            }
        }
        for (const topic of matchingTopics) {
            const listeners = this.subscriptions.get(topic);
            if (listeners) {
                for (const cb of listeners) {
                    try {
                        cb(parsed);
                    }
                    catch (err) {
                        console.error(`Error in realtime subscriber for topic [${topic}]:`, err);
                    }
                }
            }
        }
    }
}
//# sourceMappingURL=RealtimeService.js.map