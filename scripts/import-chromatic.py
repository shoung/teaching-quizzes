"""Download the source form's public image assets, preserving original image bytes."""
import concurrent.futures
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
source = json.loads((ROOT / 'sources/chromatic.json').read_text())
urls = list(dict.fromkeys([source['headerImage']] + [
    url for q in source['questions']
    for url in q['images'] + [o['image'] for o in q['options'] if o['image']]
]))
target = ROOT / 'public/images/chromatic'
target.mkdir(parents=True, exist_ok=True)


def download(item):
    i, url = item
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=40) as response:
        data = response.read()
    if data.startswith(b'\x89PNG'):
        ext = 'png'
    elif data.startswith(b'\xff\xd8\xff'):
        ext = 'jpg'
    elif data.startswith(b'RIFF') and data[8:12] == b'WEBP':
        ext = 'webp'
    elif data.startswith((b'GIF87a', b'GIF89a')):
        ext = 'gif'
    else:
        raise ValueError(f'Unexpected image format: {url}')
    name = f'{i:02d}.{ext}'
    (target / name).write_bytes(data)
    return url, f'images/chromatic/{name}', len(data)


with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    assets = list(pool.map(download, enumerate(urls)))
manifest = {url: path for url, path, _ in assets}
(ROOT / 'sources/chromatic-assets.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'downloaded': len(assets), 'bytes': sum(size for _, _, size in assets)}))
