import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('leitor de Excel permanece fora do carregamento inicial', () => {
  const app = read('src/App.jsx');
  assert.doesNotMatch(app, /^import .*read-excel-file/m);
  assert.match(app, /import\('read-excel-file\/browser'\)/);
});

test('service worker nunca armazena chamadas sensíveis do Supabase', () => {
  const serviceWorker = read('public/sw.js');
  assert.match(serviceWorker, /\.supabase\.co/);
  assert.match(serviceWorker, /isSensitiveRequest/);
  assert.match(serviceWorker, /event\.respondWith\(fetch\(request\)\)/);
});

test('funções privilegiadas possuem limite de requisições', () => {
  const manageUser = read('supabase/functions/manage-user/index.ts');
  const assistant = read('supabase/functions/commercial-assistant/index.ts');
  assert.match(manageUser, /assertWithinRateLimit\(authData\.user\.id\)/);
  assert.match(assistant, /assertWithinRateLimit\(authData\.user\.id\)/);
});

test('migração otimiza consultas isoladas por empresa', () => {
  const migration = read('supabase/migrations/202607230001_performance_hardening.sql');
  assert.match(migration, /events_company_date_status_idx/);
  assert.match(migration, /events_company_agent_date_idx/);
  assert.match(migration, /profiles_company_role_idx/);
});
