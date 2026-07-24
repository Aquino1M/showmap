const STORAGE_KEY = 'showmap:diagnostics';
const MAX_ENTRIES = 20;

const sanitize = (value) => String(value || '')
  .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [removido]')
  .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/gi, '[chave removida]')
  .slice(0, 2000);

export const recordClientError = (error, context = '') => {
  try {
    const current = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) || '[]');
    const entries = Array.isArray(current) ? current : [];
    entries.push({
      at: new Date().toISOString(),
      context: sanitize(context),
      message: sanitize(error?.message || error),
      path: globalThis.location?.pathname || '',
    });
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // O diagnóstico é opcional e nunca pode interromper o painel.
  }
};

export const installGlobalErrorMonitoring = () => {
  const onError = (event) => recordClientError(event.error || event.message, 'window.error');
  const onRejection = (event) => recordClientError(event.reason, 'unhandledrejection');
  globalThis.addEventListener?.('error', onError);
  globalThis.addEventListener?.('unhandledrejection', onRejection);
  return () => {
    globalThis.removeEventListener?.('error', onError);
    globalThis.removeEventListener?.('unhandledrejection', onRejection);
  };
};
