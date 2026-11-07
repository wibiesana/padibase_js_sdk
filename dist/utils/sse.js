/**
 * Universal Server-Sent Events (SSE) client for Browser, Node.js 18+, Bun, and Deno
 */
export class UniversalSSEClient {
    url;
    abortController = null;
    isExplicitlyClosed = false;
    reconnectTimeout = null;
    retryDelay = 2000;
    maxRetryDelay = 30000;
    currentRetryDelay = 2000;
    onMessage = null;
    onStatusChange = null;
    constructor(url) {
        this.url = url;
    }
    setUrl(newUrl) {
        const changed = this.url !== newUrl;
        this.url = newUrl;
        if (changed && this.isConnected()) {
            // Reconnect with new URL (e.g. token changed)
            this.reconnect();
        }
    }
    isConnected() {
        return this.abortController !== null && !this.isExplicitlyClosed;
    }
    connect() {
        if (this.isConnected())
            return;
        this.isExplicitlyClosed = false;
        this.startStream();
    }
    disconnect() {
        this.isExplicitlyClosed = true;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.notifyStatus('disconnected');
    }
    reconnect() {
        this.disconnect();
        this.connect();
    }
    notifyStatus(status, error) {
        if (this.onStatusChange) {
            try {
                this.onStatusChange(status, error);
            }
            catch (e) {
                console.error('Error in SSE status callback:', e);
            }
        }
    }
    async startStream() {
        if (this.isExplicitlyClosed)
            return;
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        try {
            const response = await fetch(this.url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                },
                signal,
            });
            if (!response.ok) {
                throw new Error(`SSE HTTP error ${response.status}: ${response.statusText}`);
            }
            if (!response.body) {
                throw new Error('SSE response body is not readable');
            }
            // Reset backoff delay on successful connection
            this.currentRetryDelay = this.retryDelay;
            this.notifyStatus('connected');
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            while (!signal.aborted) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split(/\r\n|\r|\n/);
                // Keep the last partial line in the buffer
                buffer = lines.pop() || '';
                let currentEvent = 'message';
                let currentData = '';
                let currentId = '';
                for (const line of lines) {
                    if (line.trim() === '') {
                        // Dispatch event when empty line encountered
                        if (currentData) {
                            // Strip trailing newline if any
                            if (currentData.endsWith('\n')) {
                                currentData = currentData.slice(0, -1);
                            }
                            if (this.onMessage) {
                                this.onMessage({
                                    event: currentEvent,
                                    data: currentData,
                                    id: currentId,
                                });
                            }
                        }
                        currentEvent = 'message';
                        currentData = '';
                        currentId = '';
                        continue;
                    }
                    if (line.startsWith(':')) {
                        // Comment or keep-alive ping, ignore
                        continue;
                    }
                    const colonIdx = line.indexOf(':');
                    let field = line;
                    let val = '';
                    if (colonIdx !== -1) {
                        field = line.substring(0, colonIdx);
                        val = line.substring(colonIdx + 1);
                        if (val.startsWith(' ')) {
                            val = val.substring(1);
                        }
                    }
                    if (field === 'event') {
                        currentEvent = val;
                    }
                    else if (field === 'data') {
                        currentData += (currentData ? '\n' : '') + val;
                    }
                    else if (field === 'id') {
                        currentId = val;
                    }
                }
            }
            // Stream ended cleanly
            if (!this.isExplicitlyClosed) {
                this.scheduleReconnect();
            }
        }
        catch (err) {
            if (signal.aborted || this.isExplicitlyClosed) {
                return;
            }
            this.notifyStatus('error', err);
            this.scheduleReconnect();
        }
    }
    scheduleReconnect() {
        if (this.isExplicitlyClosed)
            return;
        this.notifyStatus('reconnecting');
        if (this.abortController) {
            this.abortController = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            // Exponential backoff
            this.currentRetryDelay = Math.min(this.currentRetryDelay * 1.5, this.maxRetryDelay);
            this.startStream();
        }, this.currentRetryDelay);
    }
}
//# sourceMappingURL=sse.js.map