/** Format centiseconds to WCA-style time string */
export function formatTime(cs: number | string | undefined | null): string {
  if (cs == null || cs === '' || typeof cs !== 'number') return '—';
  if (cs === -1 || cs === -2) return 'DNF';
  if (cs === 0) return '0.00';
  const totalSec = cs / 100;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins > 0) {
    return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
  }
  return totalSec.toFixed(2);
}

/** Format gap vs PB: +1.23 slower, −0.45 faster */
export function formatGap(cs: number | null | undefined): string {
  if (cs == null || typeof cs !== 'number') return '—';
  const sign = cs >= 0 ? '+' : '−';
  return `${sign}${formatTime(Math.abs(cs))}`;
}

export function formatTrendDelta(cs: number | null | undefined): string {
  if (cs == null || typeof cs !== 'number') return '';
  const sign = cs >= 0 ? '+' : '−';
  return `${sign}${formatTime(Math.abs(cs))}`;
}
