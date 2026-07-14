export const edgeConfig = {
  runtime: 'edge' as const,
};

const USER_AGENT = 'cube4fun-analyzer (+https://cube4fun-analyzer.vercel.app)';

function buildUpstreamUrl(requestUrl: string, upstreamBase: string): URL {
  const url = new URL(requestUrl);
  const path = url.searchParams.getAll('path').filter(Boolean).join('/');

  const upstreamUrl = new URL(`${upstreamBase}/${path}`);

  url.searchParams.forEach((value, key) => {
    if (key === 'path') return;
    upstreamUrl.searchParams.append(key, value);
  });

  return upstreamUrl;
}

export async function proxyGet(request: Request, upstreamBase: string): Promise<Response> {
  const upstreamUrl = buildUpstreamUrl(request.url, upstreamBase);

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'user-agent': USER_AGENT,
      },
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: 'Upstream fetch failed',
        message: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 502,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      }
    );
  }
}
