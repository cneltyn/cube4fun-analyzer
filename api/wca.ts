import { edgeConfig, proxyGet } from './_proxy';

export const config = edgeConfig;

const UPSTREAM_BASE = 'https://www.worldcubeassociation.org/api/v0';

export default function handler(request: Request): Promise<Response> {
  return proxyGet(request, UPSTREAM_BASE);
}
