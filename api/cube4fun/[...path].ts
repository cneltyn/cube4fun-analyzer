import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM_BASE = 'https://cube4fun.pl/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parts = req.query.path;
  const path = Array.isArray(parts) ? parts.join('/') : (parts ?? '');
  const upstreamUrl = new URL(`${UPSTREAM_BASE}/${path}`);

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    if (Array.isArray(value)) {
      for (const v of value) upstreamUrl.searchParams.append(key, v);
    } else if (value != null) {
      upstreamUrl.searchParams.set(key, value);
    }
  }

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        // Some upstream CDNs/WAFs behave differently without a UA.
        'user-agent': 'cube4fun-analyzer (+https://cube4fun-analyzer.vercel.app)',
      },
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader(
      'content-type',
      upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
    );
    res.setHeader('cache-control', 'no-store');
    res.send(text);
  } catch (e) {
    res.status(502).json({
      error: 'Upstream fetch failed',
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

