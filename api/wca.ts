import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM_BASE = 'https://www.worldcubeassociation.org/api/v0';

function sendJson(res: VercelResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParam = req.query.path;
  const path = Array.isArray(pathParam)
    ? pathParam.filter(Boolean).join('/')
    : (pathParam ?? '');

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
        'user-agent': 'cube4fun-analyzer (+https://cube4fun-analyzer.vercel.app)',
      },
    });

    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader(
      'content-type',
      upstream.headers.get('content-type') ?? 'application/json; charset=utf-8'
    );
    res.setHeader('cache-control', 'no-store');
    res.end(text);
  } catch (e) {
    sendJson(res, 502, {
      error: 'Upstream fetch failed',
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
