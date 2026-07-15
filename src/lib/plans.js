export const PLAN_DETAILS = Object.freeze({
  lite: { label: 'Lite', price: 99, agents: 5 },
  pro: { label: 'Pro', price: 199, agents: 10 },
  ultra: { label: 'Ultra', price: 299, agents: 15 },
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
