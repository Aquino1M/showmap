import { getCityLatLng } from './map.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TOUR_STATUSES = new Set(['Reservado', 'Agendado', 'Vendido', 'Confirmado']);
const OPPORTUNITY_STATUSES = new Set(['Disponível', 'Proposta']);

const STATE_ALIASES = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE',
  'distrito federal': 'DF', espirito: 'ES', goias: 'GO', maranhao: 'MA', 'mato grosso': 'MT',
  'mato grosso do sul': 'MS', 'minas gerais': 'MG', para: 'PA', paraiba: 'PB', parana: 'PR',
  pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
  'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR', 'santa catarina': 'SC',
  'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO', go: 'GO', df: 'DF', sp: 'SP',
  rj: 'RJ', mg: 'MG', ba: 'BA', pr: 'PR', sc: 'SC', rs: 'RS', mt: 'MT', ms: 'MS',
  pa: 'PA', am: 'AM', ro: 'RO', ac: 'AC', rr: 'RR', ap: 'AP', ma: 'MA', pi: 'PI',
  ce: 'CE', rn: 'RN', pb: 'PB', pe: 'PE', al: 'AL', se: 'SE', to: 'TO', es: 'ES',
};

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

const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR');

const formatEvent = (event) => `${event.city} - ${event.stateId} (${formatDate(event.date)} · ${event.status})`;

const listEvents = (events, emptyMessage) => events.length
  ? events.slice(0, 6).map(formatEvent).join('; ')
  : emptyMessage;

const findStateInQuestion = (question) => Object.entries(STATE_ALIASES)
  .filter(([name]) => name.length > 2 ? question.includes(name) : new RegExp(`(^|\\s)${name}(?=\\s|$)`).test(question))
  .sort(([first], [second]) => second.length - first.length)[0]?.[1];

const futureFirst = (events) => [...events].sort((first, second) => toDate(first.date) - toDate(second.date));

export const LOCAL_ASSISTANT_QUESTIONS = [
  'Qual show tenho em Goiás?',
  'Quais datas livres eu tenho?',
  'Mostre minhas propostas',
  'Quais artistas estão cadastrados?',
  'Como funciona o cadastro anual?',
  'Como funciona o calendário?',
  'Como cadastrar uma proposta?',
  'Qual é o meu plano?',
];

const LOCAL_KNOWLEDGE = [
  {
    matches: /cadastro anual|evento recorrente|recorrente/,
    answer: 'O cadastro anual guarda uma oportunidade recorrente, como feira, rodeio ou aniversário da cidade. Ele não reserva nem vende a data. Quando o período se aproxima, aparece em verde entre 5 e 6 meses, laranja entre 3 e 4 meses e vermelho até 2 meses antes.',
  },
  {
    matches: /como funciona o calendario|calendario|calendário/,
    answer: 'No calendário, vermelho é vendido, laranja é agendado, roxo é proposta e azul é data livre. Você pode clicar em um dia para consultar os registros e cadastrar uma nova proposta.',
  },
  {
    matches: /como cadastrar.*proposta|criar.*proposta|nova proposta/,
    answer: 'Abra Agenda e Propostas ou clique em uma data no Calendário. Preencha contratante, evento, artista, cidade e data. A proposta fica disponível para acompanhamento e depois pode ser reservada ou vendida.',
  },
  {
    matches: /meu plano|financeiro|plano/,
    answer: 'Na aba Financeiro você consulta o plano atual, quantidade de agentes permitidos e dias restantes. Quando o plano vence, o acesso do escritório fica bloqueado até a renovação.',
  },
  {
    matches: /agente|agentes/,
    answer: 'O escritório gerencia os agentes na aba Agentes. Cada agente vê os dados do próprio escritório e pode criar propostas, reservar ou vender os registros que assumir.',
  },
  {
    matches: /mapa|mapa logistico|mapa logístico/,
    answer: 'O Mapa Logístico mostra a turnê, datas abertas e oportunidades por cidade. Você pode alternar entre o mapa visual e o mapa real, filtrar por artista e abrir os detalhes de cada ponto.',
  },
];

export const getLocalKnowledgeAnswer = (question, events) => {
  const normalized = normalize(question);
  const article = LOCAL_KNOWLEDGE.find((item) => item.matches.test(normalized));
  return article ? article.answer : getSystemAnswer(question, events);
};

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
  const normalized = normalize(question);
  const today = new Date();
  const stateId = findStateInQuestion(normalized);
  const scopedEvents = stateId ? events.filter((event) => event.stateId === stateId) : events;
  const futureEvents = futureFirst(scopedEvents.filter((event) => toDate(event.date) >= today));
  const hasShowIntent = /show|turne|agenda|evento|eventos|tenho|tem/.test(normalized);

  if (/roteiro|sugest|viagem|km|distância|distancia/.test(normalized)) return buildCommercialSuggestion(events);
  if (/datas? livres?|dispon[ií]veis?/.test(normalized)) {
    const available = futureFirst(scopedEvents.filter((event) => event.status === 'Disponível' && toDate(event.date) >= today));
    return `Datas livres${stateId ? ` em ${stateId}` : ''}: ${listEvents(available, 'nenhuma data livre futura cadastrada.')}`;
  }
  if (/proposta|propostas/.test(normalized)) {
    const proposals = futureFirst(scopedEvents.filter((event) => event.status === 'Proposta' && toDate(event.date) >= today));
    return `Propostas${stateId ? ` em ${stateId}` : ''}: ${listEvents(proposals, 'nenhuma proposta futura cadastrada.')}`;
  }
  if (/reserv|agend/.test(normalized)) {
    const booked = futureFirst(scopedEvents.filter((event) => ['Reservado', 'Agendado', 'Confirmado'].includes(event.status) && toDate(event.date) >= today));
    return `Shows agendados${stateId ? ` em ${stateId}` : ''}: ${listEvents(booked, 'nenhum show agendado futuro cadastrado.')}`;
  }
  if (/vend/.test(normalized)) {
    const sold = futureFirst(scopedEvents.filter((event) => event.status === 'Vendido' && toDate(event.date) >= today));
    return `Shows vendidos${stateId ? ` em ${stateId}` : ''}: ${listEvents(sold, 'nenhum show vendido futuro cadastrado.')}`;
  }
  if (/artista|cantor/.test(normalized)) {
    const artists = [...new Set(events.map((event) => event.artistName).filter(Boolean))];
    return artists.length ? `Artistas cadastrados neste escritório: ${artists.join(', ')}.` : 'Ainda não há artistas cadastrados nos eventos deste escritório.';
  }
  if (/contratante|prefeitura|cliente/.test(normalized)) {
    const contractors = [...new Set(scopedEvents.map((event) => event.contractorName).filter(Boolean))];
    return contractors.length ? `Contratantes${stateId ? ` em ${stateId}` : ''}: ${contractors.slice(0, 8).join(', ')}.` : 'Nenhum contratante encontrado para esta consulta.';
  }
  if (stateId && hasShowIntent) {
    return `Agenda${stateId ? ` em ${stateId}` : ''}: ${listEvents(futureEvents.filter((event) => event.status !== 'Disponível'), 'nenhum show ou proposta futuro cadastrado.')}`;
  }
  if (/próximo|proximo|quando|qual show|meus shows/.test(normalized)) {
    return `Próximos registros: ${listEvents(futureFirst(events.filter((event) => toDate(event.date) >= today && event.status !== 'Disponível')), 'nenhum show ou proposta futuro cadastrado.')}`;
  }
  return 'Posso consultar os dados deste escritório. Pergunte, por exemplo: “Qual show tenho em Goiás?”, “Quais datas livres eu tenho?”, “Mostre minhas propostas”, “Quais artistas estão cadastrados?” ou “Sugira um roteiro”.';
};
