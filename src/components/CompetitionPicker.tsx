import type { Cube4funEventListItem } from '../types';
import { formatCompOption, groupEventsList } from '../lib/eventsList';

interface CompetitionPickerProps {
  events: Cube4funEventListItem[];
  selectedCode: string;
  loading: boolean;
  listLoading: boolean;
  listError: string | null;
  onSelect: (code: string) => void;
  manualCode: string;
  onManualCodeChange: (code: string) => void;
  onManualLoad: () => void;
}

export function CompetitionPicker({
  events,
  selectedCode,
  loading,
  listLoading,
  listError,
  onSelect,
  manualCode,
  onManualCodeChange,
  onManualLoad,
}: CompetitionPickerProps) {
  const { open, upcoming, past } = groupEventsList(events);
  const inList = events.some((e) => e.code === selectedCode);

  return (
    <div className="competition-picker">
      <label>
        Competition
        <select
          value={inList ? selectedCode : ''}
          onChange={(e) => e.target.value && onSelect(e.target.value)}
          disabled={listLoading || loading}
        >
          <option value="" disabled>
            {listLoading ? 'Loading competitions…' : 'Select a competition'}
          </option>
          {open.length > 0 && (
            <optgroup label="Registration open">
              {open.map((ev) => (
                <option key={ev.code} value={ev.code}>
                  {formatCompOption(ev)}
                </option>
              ))}
            </optgroup>
          )}
          {upcoming.length > 0 && (
            <optgroup label="Upcoming">
              {upcoming.map((ev) => (
                <option key={ev.code} value={ev.code}>
                  {formatCompOption(ev)}
                </option>
              ))}
            </optgroup>
          )}
          {past.length > 0 && (
            <optgroup label="Past">
              {past.map((ev) => (
                <option key={ev.code} value={ev.code}>
                  {formatCompOption(ev)}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>

      {listError && <span className="picker-error">{listError}</span>}

      <details className="manual-code">
        <summary>Enter code manually</summary>
        <div className="input-row">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => onManualCodeChange(e.target.value)}
            placeholder="LublinFebruary2026"
            disabled={loading}
          />
          <button onClick={onManualLoad} disabled={loading || !manualCode.trim()}>
            Load
          </button>
        </div>
      </details>
    </div>
  );
}
