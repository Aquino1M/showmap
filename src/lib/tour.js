const isSoldEvent = (event) => event.status === 'Confirmado' || event.status === 'Vendido';
const isScheduledEvent = (event) => event.status === 'Reservado' || event.status === 'Agendado';
const isProposalEvent = (event) => event.status === 'Proposta';
const isRecurringRegistration = (event) => event.status === 'Cadastro' || event.isRecurring;
const isTourEvent = (event) => isSoldEvent(event) || isScheduledEvent(event);

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const atMidday = (date) => new Date(`${date}T12:00:00`);

export const getEventDateKey = (value) => {
  const dateValue = String(value || '').trim();
  const isoDate = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];

  const brazilianDate = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brazilianDate) return `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}`;

  return '';
};

export const getRecurringOccurrenceDate = (event, referenceDate = new Date()) => {
  const baseDate = getEventDateKey(event.date);
  if (!(event.isRecurring || event.status === 'Cadastro') || !baseDate) return baseDate;

  const [, month, day] = baseDate.split('-');
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  let occurrence = new Date(`${referenceDate.getFullYear()}-${month}-${day}T12:00:00`);
  if (occurrence < today) occurrence = new Date(`${referenceDate.getFullYear() + 1}-${month}-${day}T12:00:00`);
  return occurrence.toISOString().slice(0, 10);
};

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
  if (events.some(isProposalEvent)) return 'proposal';
  if (events.some(isRecurringRegistration)) return 'registration';
  if (events.some((event) => event.status === 'Disponível')) return 'available';
  return 'empty';
};

export const isCalendarEvent = (event) => isTourEvent(event) || isProposalEvent(event) || isRecurringRegistration(event) || event.status === 'Disponível';

export const getEventStatusLabel = (status) => {
  if (status === 'Confirmado') return 'Vendido';
  if (status === 'Reservado') return 'Agendado';
  return status;
};
