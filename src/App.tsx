import { useCompetitionAnalyzer } from './hooks/useCompetitionAnalyzer';
import {
  computeEventInsights,
  filterAndSortPlayers,
} from './lib/players';
import { CompetitorTable } from './components/CompetitorTable';
import { CompetitionPicker } from './components/CompetitionPicker';
import { EventHeader } from './components/EventHeader';
import './App.css';
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  const {
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
  } = useCompetitionAnalyzer();

  const displayedPlayers = filterAndSortPlayers(
    players,
    selectedEvent,
    hasTimes ? sortBy : null,
    sortDir,
    improvingOnly
  );

  const insights =
    selectedEvent && hasTimes
      ? computeEventInsights(players, selectedEvent)
      : null;

  const loadButtonLabel = () => {
    if (loadingTimes) return `Loading WCA data… ${loadProgress}`;
    if (needsFetchCount === 0) return 'All WCA data up to date';
    const parts: string[] = [];
    if (cacheStats.missing > 0) parts.push(`${cacheStats.missing} new`);
    if (cacheStats.stale > 0) parts.push(`${cacheStats.stale} stale`);
    return `Load WCA data (${parts.join(', ')})`;
  };

  return (
    <div className="app">
      <header>
        <h1>Cube4fun Competition Analyzer</h1>
        <p className="subtitle">
          PBs, recent competition form, and improvement trends
        </p>
      </header>

      <section className="controls">
        <CompetitionPicker
          events={eventsList}
          selectedCode={eventCode}
          loading={loading}
          listLoading={listLoading}
          listError={listError}
          onSelect={selectCompetition}
          manualCode={eventCode}
          onManualCodeChange={setEventCode}
          onManualLoad={() => loadEvent()}
        />
        {loading && <div className="loading-hint">Loading competition…</div>}
        {error && <div className="error">{error}</div>}
      </section>

      {event && (
        <>
          <EventHeader
            event={event}
            eventCounts={eventCounts}
            selectedEvent={selectedEvent}
            onSelectEvent={selectEvent}
          />

          <section className="actions">
            <button
              onClick={() => loadWcaTimes()}
              disabled={loadingTimes || !players.length || needsFetchCount === 0}
            >
              {loadButtonLabel()}
            </button>
            <button
              className="secondary"
              onClick={refreshWcaTimes}
              disabled={loadingTimes || !players.length || wcaIdCount === 0}
              title="Re-fetch PBs + recent results for all competitors"
            >
              Refresh all
            </button>
            {hasTimes && selectedEvent && (
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={improvingOnly}
                  onChange={(e) => setImprovingOnly(e.target.checked)}
                />
                Improving only
              </label>
            )}
            <span className="hint">
              PBs + last 5 comp averages • {cacheStats.fresh} fresh,{' '}
              {cacheStats.stale} stale, {cacheStats.missing} missing
            </span>
            <button
              className="secondary"
              onClick={handleClearCache}
              title="Clear cache"
            >
              Clear cache
            </button>
          </section>

          <CompetitorTable
            players={displayedPlayers}
            insights={insights}
            selectedEvent={selectedEvent}
            hasTimes={hasTimes}
            sortBy={sortBy}
            sortDir={sortDir}
            improvingOnly={improvingOnly}
            onSort={handleSort}
          />
        </>
      )}

      <SpeedInsights />
    </div>
  );
}

export default App;
