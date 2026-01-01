import AudioRecord from 'react-native-audio-record';
import { audioWebSocket } from './WebSocketService';
import { base64ToArrayBuffer } from '../utils/audioUtils';
import { Platform, Alert } from 'react-native';

interface AudioConfig {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource?: number;
    wavFile: string;
}

const DEFAULT_CONFIG: AudioConfig = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    wavFile: 'test.wav'
};

const MOCK_MODE = false; // Set to false to use real microphone

class AudioService {
    private isRecording: boolean = false;
    private initialized: boolean = false;
    private mockInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        // Lazy initialization
    }

    private init() {
        if (this.initialized) return;

        try {
            console.log('AudioService: Initializing AudioRecord with config:', DEFAULT_CONFIG);
            if (!MOCK_MODE) {
                AudioRecord.init(DEFAULT_CONFIG);
                AudioRecord.on('data', (data: string) => {
                    // data is a base64 encoded string
                    if (this.isRecording) {
                        console.log('AudioService: Received chunk length:', data.length);
                        const arrayBuffer = base64ToArrayBuffer(data);
                        audioWebSocket.sendAudioChunk(arrayBuffer);
                    }
                });
            } else {
                console.log('AudioService: Running in MOCK MODE (Fake Audio)');
            }

            this.initialized = true;
            console.log('AudioService: Initialization successful');
        } catch (error) {
            console.error('AudioService init failed:', error);
        }
    }

    async start() {
        if (this.isRecording) return;

        console.log('Starting Audio Recording...');
        this.init(); // Ensure initialized

        this.isRecording = true;

        // Ensure WebSocket is connected
        audioWebSocket.connect();

        try {
            // Small delay to ensure resources are ready (helps on simulator)
            await new Promise(resolve => setTimeout(() => resolve(null), 500));
            AudioRecord.start();
            console.log('AudioRecord started successfully');
        } catch (error) {
            console.error('Failed to start AudioRecord:', error);
            this.isRecording = false;
        }
    }

    async stop() {
        if (!this.isRecording) return;

        console.log('Stopping Audio Recording...');
        this.isRecording = false;

        try {
            const filePath = await AudioRecord.stop();
            console.log('Audio recording stopped. File saved at:', filePath);
        } catch (error) {
            console.error('Failed to stop AudioRecord:', error);
        }
    }
}

export const audioService = new AudioService();
