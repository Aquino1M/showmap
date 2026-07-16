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

const normalize = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-');

const toSvgPoint = ([latitude, longitude]) => ({
  cx: 1214 + longitude * 14,
  cy: 189 - latitude * 20,
});

export const getCityCoordinates = (stateId, cityName) => {
  const state = String(stateId || '').toUpperCase();
  const cityKey = `${normalize(cityName)}-${state.toLowerCase()}`;
  return toSvgPoint(CITY_COORDINATES[cityKey] || STATE_CAPITALS[state] || STATE_CAPITALS.DF);
};
