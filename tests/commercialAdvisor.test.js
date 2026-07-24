import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommercialSuggestion, getSystemAnswer } from '../src/lib/commercialAdvisor.js';

const events = [
  { id: 'go', city: 'Goiânia', stateId: 'GO', date: '2030-08-22', status: 'Vendido', artistName: 'Banda A', contractorName: 'Prefeitura de Goiânia' },
  { id: 'ba', city: 'Salvador', stateId: 'BA', date: '2030-08-24', status: 'Proposta', artistName: 'Banda B', contractorName: 'Festival Bahia' },
  { id: 'sp', city: 'São Paulo', stateId: 'SP', date: '2030-08-25', status: 'Disponível', artistName: '', contractorName: '' },
];

test('assistente encontra show do estado consultado', () => {
  const answer = getSystemAnswer('Qual show tenho em Goiás?', events);
  assert.match(answer, /Goiânia - GO/);
  assert.doesNotMatch(answer, /Salvador - BA/);
});

test('assistente usa apenas os dados recebidos do escritório', () => {
  const answer = getSystemAnswer('Quais datas livres eu tenho?', events);
  assert.match(answer, /São Paulo - SP/);
  assert.doesNotMatch(answer, /Goiânia - GO/);
});

test('assistente lista artistas cadastrados', () => {
  const answer = getSystemAnswer('Quais artistas estão cadastrados?', events);
  assert.match(answer, /Banda A/);
  assert.match(answer, /Banda B/);
});

test('roteiro aproveita oportunidades anuais próximas do show', () => {
  const routeEvents = [
    { id: 'show', city: 'Goiânia', stateId: 'GO', date: '2030-08-22', status: 'Vendido', artistName: 'Banda A' },
    { id: 'annual', city: 'Anápolis', stateId: 'GO', date: '2026-08-21', status: 'Cadastro', isRecurring: true },
  ];
  const answer = buildCommercialSuggestion(routeEvents, new Date('2030-01-01T12:00:00'));
  assert.match(answer, /Anápolis/);
  assert.match(answer, /dia anterior/);
});

test('assistente responde a contagem total sem gastar IA', () => {
  const answer = getSystemAnswer('Quantas datas tenho no total?', events);
  assert.match(answer, /3 registros no total/);
  assert.match(answer, /1 vendido/);
});
