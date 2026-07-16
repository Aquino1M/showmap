import test from 'node:test';
import assert from 'node:assert/strict';
import { filterMapEvents, getCalendarDayType, getShowProximityColor, getTourArtists } from '../src/lib/tour.js';

const events = [
  { id: '1', status: 'Disponível', artistName: '', agentId: null },
  { id: '2', status: 'Confirmado', artistName: 'Luna', agentId: 'agent-a' },
  { id: '3', status: 'Reservado', artistName: 'Caio', agentId: 'agent-b' },
  { id: '4', status: 'Proposta', artistName: 'Luna', agentId: 'agent-a' },
];

test('mapa de datas abertas não mostra shows confirmados', () => {
  assert.deepEqual(filterMapEvents(events, { role: 'company_admin' }, 'available').map((event) => event.id), ['1', '4']);
});

test('agente vê apenas sua própria turnê e pode filtrar por artista', () => {
  const user = { id: 'agent-a', role: 'agent' };
  assert.deepEqual(filterMapEvents(events, user, 'tour').map((event) => event.id), ['2']);
  assert.deepEqual(filterMapEvents(events, user, 'tour', 'Luna').map((event) => event.id), ['2']);
});

test('lista artistas confirmados sem repetir nomes', () => {
  assert.deepEqual(getTourArtists(events, { role: 'company_admin' }), ['Caio', 'Luna']);
});

test('calendário prioriza borda laranja para show e azul para data livre', () => {
  assert.equal(getCalendarDayType([{ status: 'Disponível' }]), 'available');
  assert.equal(getCalendarDayType([{ status: 'Disponível' }, { status: 'Confirmado' }]), 'show');
});

test('cor do brilho da turnê segue a proximidade do show', () => {
  const today = new Date('2026-07-16T12:00:00');
  assert.equal(getShowProximityColor('2026-08-15', today), '#ef4444');
  assert.equal(getShowProximityColor('2026-10-24', today), '#f97316');
  assert.equal(getShowProximityColor('2026-12-20', today), '#22c55e');
  assert.equal(getShowProximityColor('2027-02-01', today), null);
});
