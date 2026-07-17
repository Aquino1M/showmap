import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const loaderSource = readFileSync(new URL('../src/components/AppLoader.jsx', import.meta.url), 'utf8');

test('fluxos de navegação mantêm entradas de escritório e agente', () => {
  assert.match(appSource, /handleLoginClick\('office'\)/);
  assert.match(appSource, /handleLoginClick\('agent'\)/);
  assert.match(appSource, /setActiveTab\('map'\)/);
});

test('painel e recursos pesados são carregados sob demanda', () => {
  assert.match(loaderSource, /lazy\(\(\) => import\('\.\.\/App\.jsx'\)\)/);
  assert.match(appSource, /lazy\(\(\) => import\('\.\/components\/RealTourMap'\)\)/);
  assert.match(appSource, /lazy\(\(\) => import\('\.\/components\/FloatingCommercialAssistant'\)\)/);
});
