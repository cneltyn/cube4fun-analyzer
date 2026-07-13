import type { Cube4funEventListItem } from '../types';

export function formatCompDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCompOption(ev: Cube4funEventListItem): string {
  const start = formatCompDate(ev.time_start);
  const end = formatCompDate(ev.time_end);
  const date = start === end ? start : `${start} – ${end}`;
  return `${ev.name} — ${date} (${ev.taken_places}/${ev.max_places})`;
}

export function groupEventsList(events: Cube4funEventListItem[]) {
  const open: Cube4funEventListItem[] = [];
  const upcoming: Cube4funEventListItem[] = [];
  const past: Cube4funEventListItem[] = [];

  for (const ev of events) {
    if (ev.status === 'upcoming' && ev.register_status === 'open') {
      open.push(ev);
    } else if (ev.status === 'upcoming') {
      upcoming.push(ev);
    } else {
      past.push(ev);
    }
  }

  return { open, upcoming, past };
}
