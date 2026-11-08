import { readFile, writeFile, mkdir } from 'node:fs/promises';
import QRCode from 'qrcode';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const dataPath = new URL('src/data/sharing.json', root);
let sharing = {};
try { sharing = JSON.parse(await readFile(dataPath, 'utf8')); } catch { /* First generation. */ }
await mkdir(new URL('public/qr/', root), { recursive: true });

const supported = ['chromatic-intuition', 'ai-consulting', 'marketing-day', 'paris-salon'];
const requested = process.argv.slice(2);
if (requested.some(id => !supported.includes(id))) throw new Error('Unknown activity ID');
for (const id of requested.length ? requested : supported) {
  const longUrl = `https://shoung.github.io/teaching-quizzes/#/quiz/${id}/1`;
  let shortUrl = sharing[id]?.longUrl === longUrl ? sharing[id].shortUrl : null;
  if (!shortUrl) {
    const api = new URL('https://is.gd/create.php');
    api.searchParams.set('format', 'json');
    api.searchParams.set('url', longUrl);
    const response = await fetch(api, { signal: AbortSignal.timeout(30000) });
    const result = await response.json();
    if (!response.ok || !/^https:\/\/is\.gd\/[A-Za-z0-9_]+$/.test(result.shorturl ?? '')) {
      throw new Error(`Shortening failed for ${id}: ${JSON.stringify(result)}`);
    }
    shortUrl = result.shorturl;
  }
  const redirect = await fetch(shortUrl, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(30000) });
  if (![301, 302, 307, 308].includes(redirect.status) || redirect.headers.get('location') !== longUrl) {
    throw new Error(`Unexpected redirect for ${shortUrl}: ${redirect.status} ${redirect.headers.get('location')}`);
  }
  const qrImage = `qr/${id}.png`;
  await QRCode.toFile(fileURLToPath(new URL(`public/${qrImage}`, root)), shortUrl, {
    type: 'png', width: 480, margin: 4, errorCorrectionLevel: 'M',
    color: { dark: '#254d42', light: '#ffffff' },
  });
  sharing[id] = { longUrl, shortUrl, qrImage };
  await writeFile(dataPath, JSON.stringify(sharing, null, 2) + '\n');
  console.log(`${id}: ${shortUrl} -> ${longUrl}`);
}
