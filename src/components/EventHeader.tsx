import type { Cube4funEvent } from '../types';
import { EVENT_NAMES } from '../types';

interface EventHeaderProps {
  event: Cube4funEvent;
  eventCounts: Record<string, number>;
  selectedEvent: string | null;
  onSelectEvent: (eventId: string) => void;
}

export function EventHeader({
  event,
  eventCounts,
  selectedEvent,
  onSelectEvent,
}: EventHeaderProps) {
  return (
    <section className="event-info">
      <h2>{event.name}</h2>
      <p>
        {event.location_name} • {event.taken_places}/{event.max_places} places
      </p>
      <div className="event-badges">
        {event.competitions.map((evId) => (
          <button
            key={evId}
            className={`badge ${selectedEvent === evId ? 'active' : ''}`}
            onClick={() => onSelectEvent(evId)}
          >
            {EVENT_NAMES[evId] ?? evId}{' '}
            <span className="count">({eventCounts[evId] ?? 0})</span>
          </button>
        ))}
      </div>
    </section>
  );
}
