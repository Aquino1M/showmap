import test from 'node:test';
import assert from 'node:assert/strict';
import { canAddAgent, getPlanDaysRemaining, isPlanExpired } from '../src/lib/plans.js';

const now = new Date('2026-07-14T12:00:00');

test('calcula dias restantes sem permitir valores negativos', () => {
  assert.equal(getPlanDaysRemaining('2026-07-15', now), 2);
  assert.equal(getPlanDaysRemaining('2026-07-13', now), 0);
});

test('identifica plano vencido e ativo', () => {
  assert.equal(isPlanExpired('2026-07-13', now), true);
  assert.equal(isPlanExpired('2026-07-15', now), false);
});

test('respeita o limite de agentes de cada plano', () => {
  assert.equal(canAddAgent('lite', 4), true);
  assert.equal(canAddAgent('lite', 5), false);
  assert.equal(canAddAgent('ultra', 14), true);
  assert.equal(canAddAgent('ultra', 15), false);
});
