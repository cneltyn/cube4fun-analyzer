// cube4fun API types
export interface Cube4funEventListItem {
  id: number;
  code: string;
  name: string;
  time_start: string;
  time_end: string;
  status: string;
  register_status: string;
  location_name: string;
  taken_places: number;
  max_places: number;
  competitions: string[];
}

export interface Cube4funEvent {
  id: number;
  wca_id: string;
  name: string;
  code: string;
  time_start: string;
  time_end: string;
  status: string;
  location_name: string;
  location_address: string;
  taken_places: number;
  max_places: number;
  competitions: string[];
}

export interface Cube4funPlayer {
  id: number;
  wca_id: string | null;
  firstname: string;
  lastname: string;
  city: string;
  country: string;
  competitions: string[];
}

export interface Cube4funPlayersResponse {
  confirmed: Cube4funPlayer[];
  reserve: Cube4funPlayer[];
  unconfirmed: Cube4funPlayer[];
}

export interface WcaPersonalRecord {
  best: number;
  world_rank?: number;
  country_rank?: number;
}

export interface WcaEventRecords {
  single?: WcaPersonalRecord;
  average?: WcaPersonalRecord;
}

export interface WcaResult {
  competition_id: string;
  event_id: string;
  best: number;
  average: number;
  round_type_id: string;
}

/** Recent competition form for one event */
export interface EventFormStats {
  compCount: number;
  recentAvg: number | null;
  recentSingle: number | null;
  /** newer-half avg − older-half avg (negative = improving) */
  trendDelta: number | null;
  trend: 'improving' | 'stable' | 'slowing' | 'unknown';
  /** recentAvg − PB avg (positive = slower than PB) */
  gapFromPb: number | null;
  recentCompAvgs: number[];
  recentCompNames: string[];
}

export interface WcaPersonData {
  wca_id: string;
  personal_records: Record<string, WcaEventRecords>;
  form_by_event?: Record<string, EventFormStats>;
}

export const EVENT_NAMES: Record<string, string> = {
  '222': '2×2×2',
  '333': '3×3×3',
  '333oh': '3×3×3 OH',
  '444': '4×4×4',
  clock: 'Clock',
  pyram: 'Pyraminx',
  skewb: 'Skewb',
};

export type SortColumn =
  | 'pb_single'
  | 'pb_avg'
  | 'recent_avg'
  | 'trend'
  | 'gap_pb';
