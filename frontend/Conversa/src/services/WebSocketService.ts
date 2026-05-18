export type TranscriptMessage = {
    type: 'partial_transcript';
    text: string;
    is_final: boolean;
};

export type TranslationMessage = {
    type: 'translation';
    original: string;
    translated: string;
    is_final: boolean;
};

export type SummaryMessage = {
    type: 'summary';
    text: string;
};

export type WSMessage = TranscriptMessage | TranslationMessage | SummaryMessage;

type MessageHandler = (message: WSMessage) => void;

export type TranslationConfig = {
    source_lang: string;
    target_lang: string;
    provider: string;
    translation_enabled: boolean;
    reset_session?: boolean;
};

export class WebSocketService {
    private socket: WebSocket | null = null;
    private url: string;
    private isConnected: boolean = false;

    private messageQueue: any[] = [];
    private onMessageHandler: MessageHandler | null = null;

    constructor(url: string) {
        this.url = url;
    }

    /** Register a callback to receive parsed messages (transcripts + translations) */
    onMessage(handler: MessageHandler): void {
        this.onMessageHandler = handler;
    }

    /** Remove the message handler */
    removeMessageHandler(): void {
        this.onMessageHandler = null;
    }

    connect(): void {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            console.log('WebSocket already connected or connecting');
            return;
        }

        console.log(`Connecting to WebSocket: ${this.url}`);
        this.socket = new WebSocket(this.url);
        // Explicitly set binaryType to send/receive raw binary audio chunks
        // @ts-ignore
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = () => {
            console.log('WebSocket Connected');
            this.isConnected = true;
            this.flushQueue();
        };

        this.socket.onmessage = (e) => {
            console.log('WebSocket Message:', e.data);
            try {
                const message: WSMessage = JSON.parse(e.data);
                if (this.onMessageHandler) {
                    this.onMessageHandler(message);
                }
            } catch (err) {
                console.warn('WebSocket: Failed to parse message as JSON:', err);
            }
        };

        this.socket.onerror = (e) => {
            console.error('WebSocket Error:', e);
        };

        this.socket.onclose = (e) => {
            console.log('WebSocket Closed:', e.code, e.reason);
            this.isConnected = false;
            this.socket = null;
        };
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.isConnected = false;
        }
        this.onMessageHandler = null;
    }

    send(data: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(data);
            } catch (error) {
                console.error('WebSocketService: Send failed error:', error);
            }
        } else {
            console.log('WebSocketService: Socket not open. Queueing message.');
            this.messageQueue.push(data);
            if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
                this.connect();
            }
        }
    }

    /** Send a JSON config message to configure translation on the backend */
    sendConfig(config: TranslationConfig): void {
        const message = JSON.stringify({
            type: 'config',
            ...config,
        });
        this.send(message);
    }

    private flushQueue(): void {
        console.log(`WebSocketService: Flushing queue. Size: ${this.messageQueue.length}`);
        while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
            const data = this.messageQueue.shift();
            try {
                this.socket.send(data);
                console.log('WebSocketService: Sent queued message');
            } catch (e) {
                console.error('WebSocketService: Failed to flush message', e);
            }
        }
    }

    sendAudioChunk(data: ArrayBuffer): void {
        this.send(data);
    }
}

// Backend WebSocket endpoint
export const audioWebSocket = new WebSocketService('ws://192.168.1.174:8000/ws/transcribe');
