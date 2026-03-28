import LiveAudioStream from 'react-native-live-audio-stream';
import { audioWebSocket } from './WebSocketService';
import { base64ToArrayBuffer } from '../utils/audioUtils';
import { Platform } from 'react-native';

interface AudioConfig {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource?: number; // Optional for iOS
    bufferSize: number;
    wavFile: string;
}

const DEFAULT_CONFIG: AudioConfig = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    // audioSource: 6, // 6 = VOICE_RECOGNITION on Android (Commented out for iOS focus)
    bufferSize: 4096, // 4096 bytes is typical
    wavFile: '' // Required by types even if we don't save to file
};

// 🔧 MOCK_MODE: Set to true to bypass simulator microphone issues
// Sends fake 440Hz sine wave PCM data to test the full pipeline
const MOCK_MODE = false;

class AudioService {
    private isRecording: boolean = false;
    private initialized: boolean = false;

    // Buffer for chunking audio
    private pcmBuffer: Uint8Array = new Uint8Array(0);
    // 16kHz * 16-bit (2 bytes) * 1 channel * 0.02s (20ms) = 640 bytes
    private readonly CHUNK_SIZE_BYTES = 640;

    private dataEventCount: number = 0;
    private mockInterval: ReturnType<typeof setInterval> | null = null;
    private mockSampleIndex: number = 0;

    constructor() { }

    /**
     * Generate fake 440Hz sine wave PCM data (16-bit signed, mono, 16kHz)
     * This produces audible tone data that faster-whisper can process
     */
    private generateMockPCM(numSamples: number): Uint8Array {
        const buffer = new ArrayBuffer(numSamples * 2); // 2 bytes per sample (16-bit)
        const view = new DataView(buffer);
        const frequency = 440; // Hz (A4 note)
        const amplitude = 16000; // ~50% volume

        for (let i = 0; i < numSamples; i++) {
            const t = (this.mockSampleIndex + i) / 16000; // time in seconds
            const sample = Math.round(amplitude * Math.sin(2 * Math.PI * frequency * t));
            view.setInt16(i * 2, sample, true); // little-endian
        }
        this.mockSampleIndex += numSamples;
        return new Uint8Array(buffer);
    }

    private init() {
        if (this.initialized) return;

        try {
            console.log('AudioService: Initializing with config:', JSON.stringify(DEFAULT_CONFIG));
            if (!MOCK_MODE) {
                LiveAudioStream.init(DEFAULT_CONFIG);
                console.log('AudioService: LiveAudioStream.init() called OK');

                LiveAudioStream.on('data', (data: string) => {
                    this.dataEventCount++;

                    if (this.isRecording) {
                        const arrayBuffer = base64ToArrayBuffer(data);
                        const newBuffer = new Uint8Array(arrayBuffer);

                        const combined = new Uint8Array(this.pcmBuffer.length + newBuffer.length);
                        combined.set(this.pcmBuffer);
                        combined.set(newBuffer, this.pcmBuffer.length);
                        this.pcmBuffer = combined;

                        let chunksSent = 0;
                        while (this.pcmBuffer.length >= this.CHUNK_SIZE_BYTES) {
                            const chunk = this.pcmBuffer.slice(0, this.CHUNK_SIZE_BYTES);
                            this.pcmBuffer = this.pcmBuffer.slice(this.CHUNK_SIZE_BYTES);
                            audioWebSocket.sendAudioChunk(chunk.buffer);
                            chunksSent++;
                        }
                    }
                });
                console.log('AudioService: data event listener registered');
            } else {
                console.log('AudioService: *** MOCK MODE ACTIVE *** Simulating 440Hz sine wave');
            }

            this.initialized = true;
            console.log('AudioService: Initialization successful');
        } catch (error) {
            console.error('AudioService init FAILED:', error);
        }
    }

    async start() {
        if (this.isRecording) return;

        console.log('AudioService.start() called');
        this.init();
        this.dataEventCount = 0;
        this.mockSampleIndex = 0;

        this.isRecording = true;
        audioWebSocket.connect();

        if (MOCK_MODE) {
            console.log('MOCK: Starting fake audio stream (640 bytes every 20ms)');
            // Send 320 samples (640 bytes) every 20ms — same as real mic
            this.mockInterval = setInterval(() => {
                if (this.isRecording) {
                    const fakePCM = this.generateMockPCM(320); // 320 samples = 640 bytes
                    audioWebSocket.sendAudioChunk(fakePCM.buffer as ArrayBuffer);
                }
            }, 20);
        } else {
            try {
                console.log('Calling LiveAudioStream.start()...');
                LiveAudioStream.start();
                console.log('LiveAudioStream.start() returned OK');
            } catch (error) {
                console.error('LiveAudioStream.start() FAILED:', error);
                this.isRecording = false;
            }
        }
    }

    async stop() {
        if (!this.isRecording) return;

        console.log('Stopping Audio Recording...');
        this.isRecording = false;

        if (MOCK_MODE && this.mockInterval) {
            clearInterval(this.mockInterval);
            this.mockInterval = null;
            console.log('MOCK: Fake audio stream stopped');
        }

        try {
            if (!MOCK_MODE) {
                LiveAudioStream.stop();
            }
            console.log('Audio recording stopped.');
            this.pcmBuffer = new Uint8Array(0);
        } catch (error) {
            console.error('Failed to stop:', error);
        }
    }
}

export const audioService = new AudioService();
