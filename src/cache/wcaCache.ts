import type { WcaPersonData } from '../types';

const CACHE_KEY = 'cube4fun-wca-cache';
/** Personal bests can change after competitions — refresh after 7 days */
export const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface WcaCacheEntry {
  data: WcaPersonData;
  fetchedAt: number;
}

type RawCache = Record<string, WcaCacheEntry | WcaPersonData | LegacyPersonResponse>;

/** Old format from /persons/{id} before refactor */
interface LegacyPersonResponse {
  person?: { wca_id?: string };
  personal_records?: WcaPersonData['personal_records'];
}

function isCacheEntry(value: unknown): value is WcaCacheEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'fetchedAt' in value
  );
}

function isLegacyPersonResponse(value: unknown): value is LegacyPersonResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'personal_records' in value &&
    !('wca_id' in value) &&
    !('data' in value)
  );
}

function isPersonData(value: unknown): value is WcaPersonData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'wca_id' in value &&
    'personal_records' in value
  );
}

function normalizeEntry(
  wcaId: string,
  raw: WcaCacheEntry | WcaPersonData | LegacyPersonResponse
): WcaCacheEntry | null {
  if (isCacheEntry(raw)) return raw;

  if (isPersonData(raw)) {
    return { data: raw, fetchedAt: 0 };
  }

  if (isLegacyPersonResponse(raw) && raw.personal_records) {
    return {
      data: {
        wca_id: raw.person?.wca_id ?? wcaId,
        personal_records: raw.personal_records,
      },
      fetchedAt: 0,
    };
  }

  return null;
}

export function loadWcaCache(): Record<string, WcaCacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as RawCache;
    if (typeof parsed !== 'object' || parsed === null) return {};

    const cache: Record<string, WcaCacheEntry> = {};
    for (const [wcaId, value] of Object.entries(parsed)) {
      const entry = normalizeEntry(wcaId, value);
      if (entry) cache[wcaId] = entry;
    }
    return cache;
  } catch {
    return {};
  }
}

export function saveWcaCache(cache: Record<string, WcaCacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save WCA cache:', e);
  }
}

export function saveWcaPerson(wcaId: string, data: WcaPersonData | null) {
  if (!data) return;
  const cache = loadWcaCache();
  cache[wcaId] = { data, fetchedAt: Date.now() };
  saveWcaCache(cache);
}

export function clearWcaCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn('Failed to clear WCA cache:', e);
  }
}

export function getCachedPerson(
  cache: Record<string, WcaCacheEntry>,
  wcaId: string
): WcaPersonData | null {
  return cache[wcaId]?.data ?? null;
}

export function isEntryStale(
  entry: WcaCacheEntry | undefined,
  ttlMs = DEFAULT_TTL_MS
): boolean {
  if (!entry) return true;
  if (entry.fetchedAt === 0) return true;
  return Date.now() - entry.fetchedAt > ttlMs;
}

export function getIdsNeedingFetch(
  wcaIds: string[],
  options?: { force?: boolean; ttlMs?: number }
): { toFetch: string[]; fresh: string[]; stale: string[]; missing: string[] } {
  const cache = loadWcaCache();
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const force = options?.force ?? false;

  const missing: string[] = [];
  const stale: string[] = [];
  const fresh: string[] = [];

  for (const id of wcaIds) {
    const entry = cache[id];
    if (!entry) {
      missing.push(id);
    } else if (force || isEntryStale(entry, ttlMs)) {
      stale.push(id);
    } else {
      fresh.push(id);
    }
  }

  return {
    toFetch: force ? wcaIds : [...missing, ...stale],
    fresh,
    stale,
    missing,
  };
}

export function getCacheStats(wcaIds: string[], ttlMs = DEFAULT_TTL_MS) {
  const { fresh, stale, missing } = getIdsNeedingFetch(wcaIds, { ttlMs });
  return { fresh: fresh.length, stale: stale.length, missing: missing.length };
}

export function formatCacheAge(fetchedAt: number): string {
  if (fetchedAt === 0) return 'unknown age';
  const days = Math.floor((Date.now() - fetchedAt) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}
