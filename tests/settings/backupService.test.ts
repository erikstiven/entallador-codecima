import { describe, it, expect } from 'vitest';
import { uint8ArrayToBase64, base64ToUint8Array } from '@/modules/settings/backupService';

describe('backupService: Codificación y Restauración Binaria', () => {
  it('convierte Uint8Array a Base64 y viceversa con fidelidad de bytes 1:1', () => {
    const originalBytes = new Uint8Array([0, 1, 2, 255, 128, 64, 32, 16, 8, 4, 2, 1]);
    const b64 = uint8ArrayToBase64(originalBytes);
    expect(typeof b64).toBe('string');
    expect(b64.length).toBeGreaterThan(0);

    const restoredBytes = base64ToUint8Array(b64);
    expect(restoredBytes.length).toBe(originalBytes.length);
    for (let i = 0; i < originalBytes.length; i++) {
      expect(restoredBytes[i]).toBe(originalBytes[i]);
    }
  });

  it('procesa correctamente bloques grandes de bytes sin desbordamiento de pila', () => {
    const largeBuffer = new Uint8Array(100000);
    for (let i = 0; i < largeBuffer.length; i++) {
      largeBuffer[i] = i % 256;
    }

    const b64 = uint8ArrayToBase64(largeBuffer);
    const restored = base64ToUint8Array(b64);
    expect(restored.length).toBe(largeBuffer.length);
    expect(restored[50000]).toBe(50000 % 256);
  });
});
