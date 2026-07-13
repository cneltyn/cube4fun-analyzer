import type { EventFormStats, WcaEventRecords, WcaResult } from '../types';

export const RECENT_COMPS = 5;
const STABLE_THRESHOLD_CS = 50;

const ROUND_PRIORITY: Record<string, number> = {
  f: 0,
  g: 1,
  h: 2,
  b: 3,
  c: 4,
  e: 5,
  d: 6,
  '1': 7,
  '2': 8,
  '3': 9,
};

function pickCompRound(rounds: WcaResult[]): WcaResult {
  return [...rounds].sort((a, b) => {
    const pa = ROUND_PRIORITY[a.round_type_id] ?? 99;
    const pb = ROUND_PRIORITY[b.round_type_id] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.average - b.average;
  })[0];
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function computeEventForm(
  results: WcaResult[],
  eventId: string,
  pbRecords?: WcaEventRecords,
  lastN = RECENT_COMPS
): EventFormStats {
  const byComp = new Map<string, WcaResult[]>();

  for (const r of results) {
    if (r.event_id !== eventId || r.average <= 0) continue;
    const list = byComp.get(r.competition_id) ?? [];
    list.push(r);
    byComp.set(r.competition_id, list);
  }

  const compOrder: string[] = [];
  for (const r of results) {
    if (
      r.event_id === eventId &&
      r.average > 0 &&
      !compOrder.includes(r.competition_id)
    ) {
      compOrder.push(r.competition_id);
    }
  }

  const recentCompIds = compOrder.slice(-lastN);
  const recentRounds = recentCompIds
    .map((id) => byComp.get(id))
    .filter((r): r is WcaResult[] => !!r?.length)
    .map(pickCompRound);

  if (recentRounds.length === 0) {
    return {
      compCount: 0,
      recentAvg: null,
      recentSingle: null,
      trendDelta: null,
      trend: 'unknown',
      gapFromPb: null,
      recentCompAvgs: [],
      recentCompNames: [],
    };
  }

  const recentCompAvgs = recentRounds.map((r) => r.average);
  const recentCompNames = recentRounds.map((r) => r.competition_id);
  const recentAvg = mean(recentCompAvgs);
  const recentSingle = mean(
    recentRounds.map((r) => r.best).filter((b) => b > 0)
  );

  let trendDelta: number | null = null;
  let trend: EventFormStats['trend'] = 'unknown';

  if (recentRounds.length >= 2) {
    const mid = Math.floor(recentRounds.length / 2);
    const olderMean = mean(recentCompAvgs.slice(0, mid));
    const newerMean = mean(recentCompAvgs.slice(mid));
    trendDelta = newerMean - olderMean;
    if (trendDelta < -STABLE_THRESHOLD_CS) trend = 'improving';
    else if (trendDelta > STABLE_THRESHOLD_CS) trend = 'slowing';
    else trend = 'stable';
  }

  const pbAvg = pbRecords?.average?.best;
  const gapFromPb =
    pbAvg != null && pbAvg > 0 ? recentAvg - pbAvg : null;

  return {
    compCount: recentRounds.length,
    recentAvg,
    recentSingle: recentSingle || null,
    trendDelta,
    trend,
    gapFromPb,
    recentCompAvgs,
    recentCompNames,
  };
}

export function computeAllEventForm(
  results: WcaResult[],
  personalRecords: Record<string, WcaEventRecords>,
  lastN = RECENT_COMPS
): Record<string, EventFormStats> {
  const eventIds = new Set<string>();
  for (const r of results) {
    if (r.average > 0) eventIds.add(r.event_id);
  }

  const form: Record<string, EventFormStats> = {};
  for (const eventId of eventIds) {
    form[eventId] = computeEventForm(
      results,
      eventId,
      personalRecords[eventId],
      lastN
    );
  }
  return form;
}
