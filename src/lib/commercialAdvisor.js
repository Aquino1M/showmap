import { getCityLatLng } from './map.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TOUR_STATUSES = new Set(['Reservado', 'Agendado', 'Vendido', 'Confirmado']);
const OPPORTUNITY_STATUSES = new Set(['Disponível', 'Proposta']);

const toDate = (value) => new Date(`${value}T12:00:00`);

const distanceInKm = (first, second) => {
  const toRadians = (value) => value * Math.PI / 180;
  const [lat1, lng1] = first;
  const [lat2, lng2] = second;
  const latitudeDistance = toRadians(lat2 - lat1);
  const longitudeDistance = toRadians(lng2 - lng1);
  const calculation = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(longitudeDistance / 2) ** 2;
  return Math.round(6371 * (2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation))));
};

const formatDate = (date) => toDate(date).toLocaleDateString('pt-BR');

export const buildCommercialSuggestion = (events, referenceDate = new Date()) => {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const anchor = events
    .filter((event) => TOUR_STATUSES.has(event.status) && toDate(event.date) >= today)
    .sort((first, second) => toDate(first.date) - toDate(second.date))[0];

  if (!anchor) {
    return 'Ainda não encontrei um show reservado ou vendido no futuro para montar um roteiro. Assim que houver um, eu analiso os dias antes e depois dele.';
  }

  const anchorCoordinates = getCityLatLng(anchor.stateId, anchor.city);
  const anchorDate = toDate(anchor.date);
  const candidates = events
    .filter((event) => OPPORTUNITY_STATUSES.has(event.status))
    .map((event) => ({ ...event, distance: distanceInKm(anchorCoordinates, getCityLatLng(event.stateId, event.city)) }))
    .filter((event) => event.distance <= 600 && Math.abs((toDate(event.date) - anchorDate) / DAY_IN_MS) <= 1)
    .sort((first, second) => first.distance - second.distance);

  const before = candidates.filter((event) => toDate(event.date) < anchorDate);
  const after = candidates.filter((event) => toDate(event.date) > anchorDate);
  const describe = (items) => items.length
    ? items.slice(0, 3).map((event) => `${event.city} (${event.distance} km)`).join(', ')
    : 'nenhuma oportunidade cadastrada';

  return `Show confirmado em ${anchor.city} - ${anchor.stateId}, no dia ${formatDate(anchor.date)}. `
    + `Em até 600 km, sugestões para o dia anterior: ${describe(before)}; para o dia seguinte: ${describe(after)}. `
    + 'As sugestões usam somente datas livres e propostas já cadastradas neste escritório.';
};

export const getSystemAnswer = (question, events) => {
  const normalized = question.toLocaleLowerCase('pt-BR');
  if (/roteiro|sugest|viagem|km|distância|distancia/.test(normalized)) return buildCommercialSuggestion(events);
  if (/proposta|propostas|cadastr/.test(normalized)) return 'Para criar uma proposta, abra o Calendário, clique no dia desejado e preencha a ficha. O registro nasce com status Proposta.';
  if (/reserv|vend|agend/.test(normalized)) return 'Na Agenda e Propostas, o escritório pode marcar uma proposta como Reservado ou Vendido. O agente só altera as propostas assumidas por ele.';
  if (/data livre|disponível|disponivel/.test(normalized)) return 'Cadastro cria uma data livre no banco, com status Disponível. Ele não altera uma proposta, reserva ou venda já existente.';
  return 'Posso ajudar com propostas, datas livres, reservas, vendas e sugestões de roteiro. Experimente perguntar: “Sugira um roteiro para meus shows”.';
};
