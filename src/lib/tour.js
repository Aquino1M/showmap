const isSoldEvent = (event) => event.status === 'Confirmado' || event.status === 'Vendido';
const isScheduledEvent = (event) => event.status === 'Reservado' || event.status === 'Agendado';
const isTourEvent = (event) => isSoldEvent(event) || isScheduledEvent(event);

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const atMidday = (date) => new Date(`${date}T12:00:00`);

export const filterMapEvents = (events, user, mode, artistName = '') => {
  if (mode !== 'tour') return events.filter((event) => !isTourEvent(event));

  return events.filter((event) =>
    isTourEvent(event) &&
    (user?.role !== 'agent' || event.agentId === user.id) &&
    (!artistName || event.artistName === artistName)
  );
};

export const getTourArtists = (events, user) => [...new Set(events
  .filter((event) => isTourEvent(event) && (user?.role !== 'agent' || event.agentId === user.id))
  .map((event) => event.artistName)
  .filter(Boolean))]
  .sort((first, second) => first.localeCompare(second, 'pt-BR'));

export const getShowProximityColor = (date, now = new Date()) => {
  const today = atMidday(now.toISOString().slice(0, 10));
  const daysUntilShow = Math.ceil((atMidday(date) - today) / DAY_IN_MS);

  if (daysUntilShow < 0 || daysUntilShow > 180) return null;
  if (daysUntilShow <= 60) return '#ef4444';
  if (daysUntilShow <= 120) return '#f97316';
  return '#22c55e';
};

export const getCalendarDayType = (events) => {
  if (events.some(isSoldEvent)) return 'sold';
  if (events.some(isScheduledEvent)) return 'scheduled';
  if (events.some((event) => event.status === 'Disponível')) return 'available';
  return 'empty';
};

export const isCalendarEvent = (event) => isTourEvent(event) || event.status === 'Disponível';

export const getEventStatusLabel = (status) => {
  if (status === 'Confirmado') return 'Vendido';
  if (status === 'Reservado') return 'Agendado';
  return status;
};
