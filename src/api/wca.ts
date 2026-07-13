import { computeAllEventForm } from '../lib/formAnalysis';
import type {
  WcaEventRecords,
  WcaPersonData,
  WcaResult,
} from '../types';

const BASE = '/api/wca';
const CONCURRENCY = 5;

interface WcaPersonalRecordEntry {
  eventId: string;
  best: number;
  worldRanking?: number;
  continentalRanking?: number;
  nationalRanking?: number;
  type: 'single' | 'average';
}

function parsePersonalRecords(
  wcaId: string,
  entries: WcaPersonalRecordEntry[]
): Pick<WcaPersonData, 'wca_id' | 'personal_records'> {
  const personal_records: Record<string, WcaEventRecords> = {};

  for (const entry of entries) {
    if (!personal_records[entry.eventId]) {
      personal_records[entry.eventId] = {};
    }
    personal_records[entry.eventId][entry.type] = {
      best: entry.best,
      world_rank: entry.worldRanking,
      country_rank: entry.nationalRanking,
    };
  }

  return { wca_id: wcaId, personal_records };
}

/** PBs + full results → form analysis */
export async function fetchWcaPersonFull(
  wcaId: string
): Promise<WcaPersonData | null> {
  const [prRes, resultsRes] = await Promise.all([
    fetch(`${BASE}/persons/${wcaId}/personal_records`),
    fetch(`${BASE}/persons/${wcaId}/results`),
  ]);

  if (prRes.status === 404) return null;
  if (!prRes.ok || !resultsRes.ok) {
    throw new Error(`WCA API error: ${prRes.status}/${resultsRes.status}`);
  }

  const prEntries = (await prRes.json()) as WcaPersonalRecordEntry[];
  const results = (await resultsRes.json()) as WcaResult[];
  const { personal_records } = parsePersonalRecords(wcaId, prEntries);
  const form_by_event = computeAllEventForm(results, personal_records);

  return { wca_id: wcaId, personal_records, form_by_event };
}

export interface WcaFetchProgress {
  done: number;
  total: number;
}

export async function fetchWcaPersonsBatch(
  wcaIds: string[],
  options?: {
    onProgress?: (progress: WcaFetchProgress) => void;
    onPersonFetched?: (wcaId: string, data: WcaPersonData | null) => void;
  }
): Promise<Record<string, WcaPersonData | null>> {
  const results: Record<string, WcaPersonData | null> = {};
  let done = 0;

  const fetchOne = async (wcaId: string) => {
    try {
      const data = await fetchWcaPersonFull(wcaId);
      results[wcaId] = data;
      options?.onPersonFetched?.(wcaId, data);
    } catch (e) {
      console.warn(`Failed to fetch ${wcaId}:`, e);
      results[wcaId] = null;
      options?.onPersonFetched?.(wcaId, null);
    } finally {
      done += 1;
      options?.onProgress?.({ done, total: wcaIds.length });
    }
  };

  const queue = [...wcaIds];
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, queue.length) },
    async () => {
      while (queue.length > 0) {
        const id = queue.shift();
        if (id) await fetchOne(id);
      }
    }
  );

  await Promise.all(workers);
  return results;
}
