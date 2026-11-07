/**
 * Universal Server-Sent Events (SSE) client for Browser, Node.js 18+, Bun, and Deno
 */
export interface SSEMessage {
    event?: string;
    data: string;
    id?: string;
}
export type SSECallback = (msg: SSEMessage) => void;
export type SSEStatusCallback = (status: 'connected' | 'disconnected' | 'reconnecting' | 'error', error?: any) => void;
export declare class UniversalSSEClient {
    private url;
    private abortController;
    private isExplicitlyClosed;
    private reconnectTimeout;
    private retryDelay;
    private maxRetryDelay;
    private currentRetryDelay;
    onMessage: SSECallback | null;
    onStatusChange: SSEStatusCallback | null;
    constructor(url: string);
    setUrl(newUrl: string): void;
    isConnected(): boolean;
    connect(): void;
    disconnect(): void;
    reconnect(): void;
    private notifyStatus;
    private startStream;
    private scheduleReconnect;
}
//# sourceMappingURL=sse.d.ts.map