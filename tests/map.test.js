import test from 'node:test';
import assert from 'node:assert/strict';
import { getCityCoordinates } from '../src/lib/map.js';

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
