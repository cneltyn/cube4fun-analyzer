import { RECENT_COMPS } from '../lib/formAnalysis';
import {
  getEventForm,
  getPbTime,
  type PlayerWithTimes,
  type SortDir,
} from '../lib/players';
import { formatGap, formatTime, formatTrendDelta } from '../lib/time';
import { EVENT_NAMES, type SortColumn } from '../types';

interface EventInsights {
  total: number;
  withForm: number;
  improving: number;
  medianRecentAvg: number | null;
}

interface CompetitorTableProps {
  players: PlayerWithTimes[];
  insights: EventInsights | null;
  selectedEvent: string | null;
  hasTimes: boolean;
  sortBy: SortColumn;
  sortDir: SortDir;
  improvingOnly: boolean;
  onSort: (column: SortColumn) => void;
}

const SORT_COLUMNS: { key: SortColumn; label: string; title: string }[] = [
  { key: 'pb_single', label: 'PB', title: 'Personal best single' },
  { key: 'pb_avg', label: 'PB avg', title: 'Personal best average' },
  {
    key: 'recent_avg',
    label: `Recent (${RECENT_COMPS})`,
    title: `Mean average over last ${RECENT_COMPS} competitions`,
  },
  { key: 'trend', label: 'Trend', title: 'Recent half vs older half (negative = improving)' },
  { key: 'gap_pb', label: 'vs PB', title: 'Recent avg minus PB avg' },
];

export function CompetitorTable({
  players,
  insights,
  selectedEvent,
  hasTimes,
  sortBy,
  sortDir,
  improvingOnly,
  onSort,
}: CompetitorTableProps) {
  return (
    <section className="competitors">
      <h3>
        Competitors ({players.length})
        {selectedEvent && (
          <span> — {EVENT_NAMES[selectedEvent] ?? selectedEvent}</span>
        )}
      </h3>

      {insights && insights.withForm > 0 && (
        <div className="insights">
          <span>
            Median recent avg:{' '}
            <strong>{formatTime(insights.medianRecentAvg)}</strong>
          </span>
          <span>
            Improving: <strong className="trend-improving">{insights.improving}</strong>
            /{insights.withForm}
          </span>
          <span className="muted">
            {insights.withForm} with {RECENT_COMPS}+ comp history
          </span>
        </div>
      )}

      {!selectedEvent && hasTimes && (
        <p className="table-hint">Select an event to see times and form analysis.</p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>City</th>
              {hasTimes && selectedEvent ? (
                SORT_COLUMNS.map(({ key, label, title }) => (
                  <th key={key}>
                    <button
                      className="sort-header"
                      onClick={() => onSort(key)}
                      title={title}
                    >
                      {label}
                      {sortBy === key && (
                        <span className="sort-arrow">
                          {sortDir === 'asc' ? ' ↑' : ' ↓'}
                        </span>
                      )}
                    </button>
                  </th>
                ))
              ) : (
                <th>Events</th>
              )}
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && improvingOnly && (
              <tr>
                <td colSpan={8} className="empty-row">
                  No improving competitors for this event.
                </td>
              </tr>
            )}
            {players.map((player, i) => (
              <CompetitorRow
                key={player.id}
                index={i + 1}
                player={player}
                selectedEvent={selectedEvent}
                hasTimes={hasTimes}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CompetitorRow({
  index,
  player,
  selectedEvent,
  hasTimes,
}: {
  index: number;
  player: PlayerWithTimes;
  selectedEvent: string | null;
  hasTimes: boolean;
}) {
  const form = selectedEvent
    ? getEventForm(player.wcaData, selectedEvent)
    : undefined;

  const recentTooltip =
    form && form.recentCompAvgs.length > 0
      ? form.recentCompAvgs.map((a) => formatTime(a)).join(' → ')
      : undefined;

  return (
    <tr>
      <td>{index}</td>
      <td>
        <span className="name">
          {player.firstname} {player.lastname}
        </span>
        {player.wca_id ? (
          <a
            href={`https://www.worldcubeassociation.org/persons/${player.wca_id}`}
            target="_blank"
            rel="noreferrer"
            className="wca-link"
          >
            {player.wca_id}
          </a>
        ) : (
          <span className="wca-link muted">no WCA ID</span>
        )}
      </td>
      <td>{player.city}</td>

      {hasTimes && selectedEvent ? (
        <>
          <td className="time pb">
            {formatTime(getPbTime(player.wcaData, selectedEvent, 'single'))}
          </td>
          <td className="time pb">
            {formatTime(getPbTime(player.wcaData, selectedEvent, 'average'))}
          </td>
          <td className="time recent" title={recentTooltip}>
            {formatTime(form?.recentAvg)}
            {form && form.compCount < RECENT_COMPS && form.compCount > 0 && (
              <span className="comp-count"> ({form.compCount})</span>
            )}
          </td>
          <td className={`trend trend-${form?.trend ?? 'unknown'}`}>
            <TrendBadge trend={form?.trend} delta={form?.trendDelta} />
          </td>
          <td
            className={`time gap ${form?.gapFromPb != null && form.gapFromPb <= 0 ? 'on-form' : ''}`}
          >
            {formatGap(form?.gapFromPb)}
          </td>
        </>
      ) : (
        <td>
          <div className="event-tags">
            {player.competitions.map((c) => (
              <span key={c} className="tag">
                {EVENT_NAMES[c] ?? c}
              </span>
            ))}
          </div>
        </td>
      )}
    </tr>
  );
}

function TrendBadge({
  trend,
  delta,
}: {
  trend?: 'improving' | 'stable' | 'slowing' | 'unknown';
  delta?: number | null;
}) {
  if (!trend || trend === 'unknown') return <span>—</span>;

  const icons = { improving: '↑', stable: '→', slowing: '↓', unknown: '—' };
  const labels = {
    improving: 'Improving',
    stable: 'Stable',
    slowing: 'Slowing',
    unknown: 'Unknown',
  };

  return (
    <span title={`${labels[trend]}${delta != null ? ` (${formatTrendDelta(delta)})` : ''}`}>
      {icons[trend]} {labels[trend]}
    </span>
  );
}
