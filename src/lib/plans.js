export const PLAN_DETAILS = Object.freeze({
  lite: {
    label: 'Lite', price: 1000, agents: 5,
    benefits: ['Agenda inteligente e propostas', 'Mapa logístico', 'Até 5 agentes'],
  },
  pro: {
    label: 'Pro', price: 2000, agents: 10,
    benefits: ['Tudo do Lite', 'Oportunidades anuais', 'Até 10 agentes'],
  },
  ultra: {
    label: 'Ultra', price: 3000, agents: 20,
    benefits: ['Tudo do Pro', 'Inteligência comercial', 'Importar oportunidades', 'Até 20 agentes'],
  },
});

export const getPlan = (planKey) => PLAN_DETAILS[planKey] || PLAN_DETAILS.lite;

const getExpiration = (value) => value ? new Date(`${value}T23:59:59`) : null;

export const isPlanExpired = (planExpiresAt, now = new Date()) => {
  const expiration = getExpiration(planExpiresAt);
  return !expiration || expiration.getTime() < now.getTime();
};

export const getPlanDaysRemaining = (planExpiresAt, now = new Date()) => {
  const expiration = getExpiration(planExpiresAt);
  if (!expiration) return 0;
  return Math.max(0, Math.ceil((expiration.getTime() - now.getTime()) / 86400000));
};

export const canAddAgent = (planKey, currentAgentCount) => currentAgentCount < getPlan(planKey).agents;
