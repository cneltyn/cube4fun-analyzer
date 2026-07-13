import type { Cube4funPlayer, EventFormStats, SortColumn, WcaPersonData } from '../types';

export type PlayerWithTimes = Cube4funPlayer & {
  wcaData: WcaPersonData | null;
};

export type SortDir = 'asc' | 'desc';

export function countByEvent(
  players: PlayerWithTimes[],
  eventIds: string[]
): Record<string, number> {
  return eventIds.reduce(
    (acc, evId) => {
      acc[evId] = players.filter((p) => p.competitions.includes(evId)).length;
      return acc;
    },
    {} as Record<string, number>
  );
}

export function getPbTime(
  wcaData: WcaPersonData | null | undefined,
  eventId: string,
  type: 'single' | 'average'
): number | undefined {
  return wcaData?.personal_records?.[eventId]?.[type]?.best;
}

export function getEventForm(
  wcaData: WcaPersonData | null | undefined,
  eventId: string
): EventFormStats | undefined {
  return wcaData?.form_by_event?.[eventId];
}

const SORT_MISSING = 999999;

export function getSortValue(
  player: PlayerWithTimes,
  eventId: string,
  sortBy: SortColumn
): number {
  const form = getEventForm(player.wcaData, eventId);

  switch (sortBy) {
    case 'pb_single':
      return getPbTime(player.wcaData, eventId, 'single') ?? SORT_MISSING;
    case 'pb_avg':
      return getPbTime(player.wcaData, eventId, 'average') ?? SORT_MISSING;
    case 'recent_avg':
      return form?.recentAvg ?? SORT_MISSING;
    case 'trend':
      return form?.trendDelta ?? SORT_MISSING;
    case 'gap_pb':
      return form?.gapFromPb ?? SORT_MISSING;
    default:
      return SORT_MISSING;
  }
}

export function filterAndSortPlayers(
  players: PlayerWithTimes[],
  selectedEvent: string | null,
  sortBy: SortColumn | null,
  sortDir: SortDir,
  improvingOnly = false
): PlayerWithTimes[] {
  let list = selectedEvent
    ? players.filter((p) => p.competitions.includes(selectedEvent))
    : players;

  if (improvingOnly && selectedEvent) {
    list = list.filter(
      (p) => getEventForm(p.wcaData, selectedEvent)?.trend === 'improving'
    );
  }

  if (!selectedEvent || !sortBy) return list;

  return [...list].sort((a, b) => {
    const aVal = getSortValue(a, selectedEvent, sortBy);
    const bVal = getSortValue(b, selectedEvent, sortBy);
    const cmp = aVal - bVal;
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

export function computeEventInsights(
  players: PlayerWithTimes[],
  eventId: string
) {
  const inEvent = players.filter((p) => p.competitions.includes(eventId));
  const withForm = inEvent
    .map((p) => getEventForm(p.wcaData, eventId))
    .filter((f): f is EventFormStats => !!f && f.recentAvg != null);

  const improving = withForm.filter((f) => f.trend === 'improving').length;
  const recentAvgs = withForm.map((f) => f.recentAvg!).sort((a, b) => a - b);
  const median =
    recentAvgs.length > 0
      ? recentAvgs[Math.floor(recentAvgs.length / 2)]
      : null;

  return {
    total: inEvent.length,
    withForm: withForm.length,
    improving,
    medianRecentAvg: median,
  };
}
