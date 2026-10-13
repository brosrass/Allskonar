#!/usr/bin/env python3
"""Summarise a HAR exported from browser DevTools (Network → Save all as HAR).

Use when the target site can't be reached from this environment: the user
captures it in their own browser and uploads the HAR. Run with `python3 -I`.

  python3 -I har_summary.py capture.har [--extract DIR]

Prints requests per host (count, bytes, MIME types) and every request line.
--extract writes first-party response bodies to DIR for local inspection only;
never commit them to the repo.
"""
import base64, collections, json, os, sys
from urllib.parse import urlparse

def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    har = json.load(open(args[0], encoding='utf-8'))
    out = args[args.index('--extract') + 1] if '--extract' in args else None
    ents = har['log']['entries']
    first = urlparse(ents[0]['request']['url']).hostname if ents else ''
    by = collections.defaultdict(lambda: [0, 0, collections.Counter()])
    print(f"{len(ents)} requests, first-party host: {first}\n")
    for i, e in enumerate(ents):
        r, c = e['response'], e['response'].get('content', {})
        u = e['request']['url']; h = urlparse(u).hostname or '?'
        size = c.get('size') or 0; mime = (c.get('mimeType') or '').split(';')[0]
        by[h][0] += 1; by[h][1] += size; by[h][2][mime] += 1
        print(f"{i:3d} {r['status']:3d} {size:9d} {mime[:24]:24s} {u[:150]}")
        if out and c.get('text') and h.endswith(first.removeprefix('www.')):
            os.makedirs(out, exist_ok=True)
            data = base64.b64decode(c['text']) if c.get('encoding') == 'base64' else c['text'].encode()
            name = f"{i:03d}_" + (urlparse(u).path.strip('/').replace('/', '_') or 'index')[:80]
            open(os.path.join(out, name), 'wb').write(data)
    print('\nBy host:')
    for h, (n, s, m) in sorted(by.items(), key=lambda x: -x[1][1]):
        print(f"{n:4d} {s/1024:9.1f} KB  {h}  {dict(m.most_common(3))}")

if __name__ == '__main__':
    main()
