import { useCallback, useEffect, useState } from 'react';
import { fetchEventByCode, fetchEventPlayers, fetchEventsList } from '../api/cube4fun';
import { fetchWcaPersonsBatch } from '../api/wca';
import {
  countByEvent,
  type PlayerWithTimes,
  type SortDir,
} from '../lib/players';
import type { Cube4funEvent, Cube4funEventListItem, Cube4funPlayer, SortColumn } from '../types';
import {
  clearWcaCache,
  getCacheStats,
  getCachedPerson,
  getIdsNeedingFetch,
  loadWcaCache,
  saveWcaPerson,
} from '../cache/wcaCache';

export function useCompetitionAnalyzer(defaultCode = 'LublinFebruary2026') {
  const [eventCode, setEventCode] = useState(defaultCode);
  const [event, setEvent] = useState<Cube4funEvent | null>(null);
  const [players, setPlayers] = useState<PlayerWithTimes[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortColumn>('recent_avg');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [improvingOnly, setImprovingOnly] = useState(false);
  const [eventsList, setEventsList] = useState<Cube4funEventListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEventsList()
      .then((list) => {
        if (!cancelled) setEventsList(list);
      })
      .catch((e) => {
        if (!cancelled) {
          setListError(
            e instanceof Error ? e.message : 'Failed to load competitions list'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasTimes = players.some((p) => p.wcaData);
  const eventCounts = event ? countByEvent(players, event.competitions) : {};

  const wcaIds = players
    .map((p) => p.wca_id)
    .filter((id): id is string => !!id);
  const wcaIdCount = wcaIds.length;
  const cacheStats = getCacheStats(wcaIds);
  const needsFetchCount = cacheStats.missing + cacheStats.stale;

  const loadEvent = useCallback(async (code?: string) => {
    const targetCode = (code ?? eventCode).trim();
    if (!targetCode) return;

    setEventCode(targetCode);
    setError(null);
    setLoading(true);
    setPlayers([]);
    setSelectedEvent(null);
    setImprovingOnly(false);
    try {
      const ev = await fetchEventByCode(targetCode);
      const { confirmed } = await fetchEventPlayers(ev.id);
      const cache = loadWcaCache();
      const withCache = confirmed.map((p: Cube4funPlayer) => ({
        ...p,
        wcaData: p.wca_id ? getCachedPerson(cache, p.wca_id) : null,
      }));
      setEvent(ev);
      setPlayers(withCache);
      if (ev.competitions.length > 0) {
        setSelectedEvent(ev.competitions[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [eventCode]);

  const selectCompetition = useCallback(
    (code: string) => {
      loadEvent(code);
    },
    [loadEvent]
  );

  const loadWcaTimes = useCallback(
    async (force = false) => {
      if (!players.length) return;

      const ids = players
        .map((p) => p.wca_id)
        .filter((id): id is string => !!id);

      if (!ids.length) {
        setError('No WCA IDs found among confirmed players');
        return;
      }

      const { toFetch, fresh } = getIdsNeedingFetch(ids, { force });

      if (toFetch.length === 0) {
        const cache = loadWcaCache();
        setPlayers((prev) =>
          prev.map((p) => ({
            ...p,
            wcaData: p.wca_id ? getCachedPerson(cache, p.wca_id) : null,
          }))
        );
        return;
      }

      setError(null);
      setLoadingTimes(true);
      setLoadProgress(`0/${toFetch.length} (${fresh.length} fresh)`);

      try {
        await fetchWcaPersonsBatch(toFetch, {
          onProgress: ({ done, total }) => {
            setLoadProgress(`${done}/${total} (${fresh.length} fresh)`);
          },
          onPersonFetched: (wcaId, data) => {
            if (data) saveWcaPerson(wcaId, data);
            setPlayers((prev) =>
              prev.map((p) =>
                p.wca_id === wcaId ? { ...p, wcaData: data } : p
              )
            );
          },
        });
        setLoadProgress('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load WCA data');
      } finally {
        setLoadingTimes(false);
      }
    },
    [players]
  );

  const refreshWcaTimes = useCallback(() => loadWcaTimes(true), [loadWcaTimes]);

  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortBy === column) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(column);
        setSortDir('asc');
      }
    },
    [sortBy]
  );

  const handleClearCache = useCallback(() => {
    clearWcaCache();
    setPlayers((prev) => prev.map((p) => ({ ...p, wcaData: null })));
  }, []);

  const selectEvent = useCallback((evId: string) => {
    setSelectedEvent((prev) => (prev === evId ? null : evId));
  }, []);

  return {
    eventCode,
    setEventCode,
    event,
    players,
    eventsList,
    listLoading,
    listError,
    loading,
    loadingTimes,
    loadProgress,
    error,
    selectedEvent,
    sortBy,
    sortDir,
    improvingOnly,
    setImprovingOnly,
    hasTimes,
    eventCounts,
    wcaIdCount,
    cacheStats,
    needsFetchCount,
    loadEvent,
    selectCompetition,
    loadWcaTimes,
    refreshWcaTimes,
    handleSort,
    handleClearCache,
    selectEvent,
  };
}
