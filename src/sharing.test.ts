import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import sharing from './data/sharing.json';

describe('可掃描的課堂分享圖片', () => {
  for (const [id, link] of Object.entries(sharing)) {
    it(`${id} 的實際 PNG 可解碼為對應短網址，分享目的地固定第一題`, () => {
      const file = readFileSync(resolve(process.cwd(), 'public', link.qrImage));
      const png = PNG.sync.read(file);
      const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
      expect(decoded?.data).toBe(link.shortUrl);
      expect(link.longUrl).toBe(`https://shoung.github.io/teaching-quizzes/#/quiz/${id}/1`);
    });
  }
});
