import { decode as atob } from 'base-64';

/**
 * Converts a Base64 string to an ArrayBuffer.
 * This is useful for converting audio data reserved from native modules.
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};
