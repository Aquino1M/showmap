import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MAP_VIEWPORT, getCityCoordinates, getPannedViewport, getZoomedViewport } from '../src/lib/map.js';

test('Porangatu é exibida na região de Goiás, não no Amazonas', () => {
  const porangatu = getCityCoordinates('GO', 'Porangatu');
  const manaus = getCityCoordinates('AM', 'Manaus');

  assert.ok(porangatu.cx > 500 && porangatu.cx < 550);
  assert.ok(porangatu.cy > 430 && porangatu.cy < 490);
  assert.ok(porangatu.cx > manaus.cx + 100);
});

test('cidade desconhecida usa a capital do estado como posição segura', () => {
  assert.deepEqual(getCityCoordinates('GO', 'Cidade ainda não cadastrada'), getCityCoordinates('GO', 'Goiânia'));
});

test('zoom aproxima e deslocamento respeita os limites do mapa', () => {
  const zoomed = getZoomedViewport(DEFAULT_MAP_VIEWPORT, 0.8, { x: 0.5, y: 0.5 });
  assert.equal(zoomed.width, 800);
  assert.equal(zoomed.x, 100);
  assert.ok(Math.abs(zoomed.y - 91.2) < 0.001);

  const panned = getPannedViewport(zoomed, -9999, 9999);
  assert.equal(panned.x, 0);
  assert.equal(panned.y, DEFAULT_MAP_VIEWPORT.height - zoomed.height);
});
