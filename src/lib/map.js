const CITY_COORDINATES = {
  'porangatu-go': [-13.439, -49.149],
  'goiania-go': [-16.686, -49.264],
  'brasilia-df': [-15.794, -47.882],
  'sao-paulo-sp': [-23.551, -46.633],
  'rio-de-janeiro-rj': [-22.906, -43.173],
  'belo-horizonte-mg': [-19.916, -43.934],
  'salvador-ba': [-12.971, -38.501],
  'curitiba-pr': [-25.429, -49.272],
  'porto-alegre-rs': [-30.034, -51.230],
  'florianopolis-sc': [-27.595, -48.549],
  'vitoria-es': [-20.315, -40.312],
  'manaus-am': [-3.119, -60.021],
  'belem-pa': [-1.456, -48.490],
  'cuiaba-mt': [-15.601, -56.097],
  'campo-grande-ms': [-20.469, -54.620],
  'palmas-to': [-10.184, -48.333],
  'fortaleza-ce': [-3.732, -38.527],
  'recife-pe': [-8.047, -34.877],
  'natal-rn': [-5.794, -35.211],
  'joao-pessoa-pb': [-7.119, -34.845],
  'maceio-al': [-9.649, -35.709],
  'aracaju-se': [-10.947, -37.073],
  'teresina-pi': [-5.093, -42.803],
  'sao-luis-ma': [-2.530, -44.306],
  'macapa-ap': [0.035, -51.070],
  'rio-branco-ac': [-9.974, -67.810],
  'porto-velho-ro': [-8.761, -63.902],
  'boa-vista-rr': [2.823, -60.675],
};

const STATE_CAPITALS = {
  AC: [-9.974, -67.810], AL: [-9.649, -35.709], AP: [0.035, -51.070], AM: [-3.119, -60.021],
  BA: [-12.971, -38.501], CE: [-3.732, -38.527], DF: [-15.794, -47.882], ES: [-20.315, -40.312],
  GO: [-16.686, -49.264], MA: [-2.530, -44.306], MT: [-15.601, -56.097], MS: [-20.469, -54.620],
  MG: [-19.916, -43.934], PA: [-1.456, -48.490], PB: [-7.119, -34.845], PR: [-25.429, -49.272],
  PE: [-8.047, -34.877], PI: [-5.093, -42.803], RJ: [-22.906, -43.173], RN: [-5.794, -35.211],
  RS: [-30.034, -51.230], RO: [-8.761, -63.902], RR: [2.823, -60.675], SC: [-27.595, -48.549],
  SP: [-23.551, -46.633], SE: [-10.947, -37.073], TO: [-10.184, -48.333],
};

const STATE_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

const normalize = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-');

const toSvgPoint = ([latitude, longitude]) => ({
  cx: 1214 + longitude * 14,
  cy: 189 - latitude * 20,
});

export const DEFAULT_MAP_VIEWPORT = { x: 0, y: 0, width: 1000, height: 912 };
const MIN_MAP_WIDTH = 300;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const constrainViewport = (viewport) => {
  const width = clamp(viewport.width, MIN_MAP_WIDTH, DEFAULT_MAP_VIEWPORT.width);
  const height = width * (DEFAULT_MAP_VIEWPORT.height / DEFAULT_MAP_VIEWPORT.width);
  return {
    width,
    height,
    x: clamp(viewport.x, 0, DEFAULT_MAP_VIEWPORT.width - width),
    y: clamp(viewport.y, 0, DEFAULT_MAP_VIEWPORT.height - height),
  };
};

export const getZoomedViewport = (viewport, factor, focus = { x: 0.5, y: 0.5 }) => {
  const width = viewport.width * factor;
  const height = viewport.height * factor;
  return constrainViewport({
    width,
    height,
    x: viewport.x + (viewport.width - width) * focus.x,
    y: viewport.y + (viewport.height - height) * focus.y,
  });
};

export const getPannedViewport = (viewport, deltaX, deltaY) => constrainViewport({
  ...viewport,
  x: viewport.x + deltaX,
  y: viewport.y + deltaY,
});

export const getCityCoordinates = (stateId, cityName) => {
  return toSvgPoint(getCityLatLng(stateId, cityName));
};

export const getCityLatLng = (stateId, cityName) => {
  const state = String(stateId || '').toUpperCase();
  const cityKey = `${normalize(cityName)}-${state.toLowerCase()}`;
  return CITY_COORDINATES[cityKey] || STATE_CAPITALS[state] || STATE_CAPITALS.DF;
};

export const getCityCoordinateKey = (stateId, cityName) => `${String(stateId || '').toUpperCase()}:${normalize(cityName)}`;

export const resolveCityLatLng = async (stateId, cityName) => {
  const state = String(stateId || '').toUpperCase();
  const key = getCityCoordinateKey(state, cityName);
  const storageKey = `showmap:geocoding:${key}`;

  try {
    const cached = globalThis.localStorage?.getItem(storageKey);
    if (cached) {
      const coordinates = JSON.parse(cached);
      if (Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every(Number.isFinite)) return coordinates;
      // Versões antigas salvavam o ponto do SVG ({ cx, cy }). Esse formato não serve para o mapa GPS.
      globalThis.localStorage?.removeItem(storageKey);
    }
  } catch {
    // A consulta continua normalmente se o navegador bloquear o armazenamento local.
  }

  try {
    const query = `${cityName}, ${STATE_NAMES[state] || state}, Brasil`;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`);
    if (!response.ok) return null;
    const [result] = await response.json();
    if (!result?.lat || !result?.lon) return null;
    const coordinates = [Number(result.lat), Number(result.lon)];
    try { globalThis.localStorage?.setItem(storageKey, JSON.stringify(coordinates)); } catch { /* cache opcional */ }
    return coordinates;
  } catch {
    return null;
  }
};

export const resolveCityCoordinates = async (stateId, cityName) => {
  const coordinates = await resolveCityLatLng(stateId, cityName);
  return coordinates ? toSvgPoint(coordinates) : null;
};
