import { BaseService } from './BaseService.js';
import { UniversalSSEClient, SSEMessage } from '../utils/sse.js';
import type { RealtimeCallback, RealtimeMessage } from '../types.js';

export type ResyncCallback = () => void;

export class RealtimeService extends BaseService {
  private sseClient: UniversalSSEClient | null = null;
  private subscriptions: Map<string, Set<RealtimeCallback<any>>> = new Map();
  private resyncListeners: Set<ResyncCallback> = new Set();
  private isAutoConnectEnabled: boolean = true;

  constructor(client: any) {
    super(client);

    // Watch authStore changes to update SSE token dynamically
    if (this.client.authStore) {
      this.client.authStore.onChange((token: string) => {
        if (this.sseClient && this.sseClient.isConnected()) {
          this.sseClient.setUrl(this.buildRealtimeUrl(token));
        }
      });
    }
  }

  /**
   * Whether auto-reconnect and connection upon first subscription is enabled
   */
  get autoConnect(): boolean {
    return this.isAutoConnectEnabled;
  }

  set autoConnect(value: boolean) {
    this.isAutoConnectEnabled = value;
  }

  /**
   * Constructs the full realtime SSE URL with optional auth token
   */
  private buildRealtimeUrl(token?: string): string {
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
  isConnected(): boolean {
    return this.sseClient ? this.sseClient.isConnected() : false;
  }

  /**
   * Manually establishes SSE connection
   */
  connect(): void {
    if (!this.sseClient) {
      const url = this.buildRealtimeUrl();
      this.sseClient = new UniversalSSEClient(url);

      this.sseClient.onMessage = (msg: SSEMessage) => {
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
  disconnect(): void {
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
  subscribe<T = any>(topic: string, callback: RealtimeCallback<T>): () => void {
    const normalizedTopic = this.normalizeTopic(topic);

    if (!this.subscriptions.has(normalizedTopic)) {
      this.subscriptions.set(normalizedTopic, new Set());
    }

    this.subscriptions.get(normalizedTopic)!.add(callback);

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
  unsubscribe(topic?: string, callback?: RealtimeCallback<any>): void {
    if (!topic) {
      // Clear all
      this.subscriptions.clear();
      this.disconnect();
      return;
    }

    const normalizedTopic = this.normalizeTopic(topic);
    const listeners = this.subscriptions.get(normalizedTopic);
    if (!listeners) return;

    if (callback) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.subscriptions.delete(normalizedTopic);
      }
    } else {
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
  onResync(callback: ResyncCallback): () => void {
    this.resyncListeners.add(callback);
    return () => {
      this.resyncListeners.delete(callback);
    };
  }

  private normalizeTopic(topic: string): string {
    let t = (topic || '*').trim();
    if (t.endsWith('/*')) {
      t = t.substring(0, t.length - 2);
    }
    return t;
  }

  private handleMessage(msg: SSEMessage): void {
    // Check if lagged event
    if (msg.event === 'lagged' || msg.data === 'resync') {
      for (const listener of this.resyncListeners) {
        try {
          listener();
        } catch (e) {
          console.error('Error in resync listener:', e);
        }
      }
      return;
    }

    if (!msg.data) return;

    let parsed: RealtimeMessage<any>;
    try {
      parsed = JSON.parse(msg.data);
    } catch {
      return;
    }

    const table = parsed.table || (parsed as any).collection || '';
    const recordId = parsed.record && typeof parsed.record === 'object' ? String(parsed.record.id || '') : '';

    // Collect matching topics:
    // 1. Wildcard '*'
    // 2. Collection wildcard 'table' or 'table/*'
    // 3. Record-specific 'table/record_id'
    const matchingTopics = new Set<string>();
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
          } catch (err) {
            console.error(`Error in realtime subscriber for topic [${topic}]:`, err);
          }
        }
      }
    }
  }
}
