import type {
  Cube4funEvent,
  Cube4funEventListItem,
  Cube4funPlayersResponse,
} from '../types';

const BASE = '/api/cube4fun';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`cube4fun API error: ${res.status}`);
  return res.json();
}

export function fetchEventsList(): Promise<Cube4funEventListItem[]> {
  return getJson(`${BASE}/events/list`);
}

export function fetchEventByCode(code: string): Promise<Cube4funEvent> {
  return getJson(
    `${BASE}/events/get/by-code/${encodeURIComponent(code)}?with_long_texts=1`
  );
}

export function fetchEventPlayers(
  eventId: number
): Promise<Cube4funPlayersResponse> {
  return getJson(`${BASE}/events/get-players/${eventId}`);
}
