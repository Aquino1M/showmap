const isTourEvent = (event) => event.status === 'Confirmado' || event.status === 'Reservado';

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
