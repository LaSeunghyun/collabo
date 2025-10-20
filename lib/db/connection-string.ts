import { DB_CONFIG } from '@/lib/constants/app-config';

export const normalizeServerlessConnectionString = (databaseUrl: string) => {
  const isDataProxy = databaseUrl.startsWith('prisma://');

  if (isDataProxy) {
    return databaseUrl;
  }

  try {
    const url = new URL(databaseUrl);
    const isPostgres = url.protocol === 'postgres:' || url.protocol === 'postgresql:';

    if (!isPostgres) {
      return databaseUrl;
    }

    const ensureParam = (key: string, value: string, alwaysOverride = false) => {
      const currentValue = url.searchParams.get(key);

      if (alwaysOverride || !currentValue || currentValue.trim().length === 0) {
        url.searchParams.set(key, value);
      }
    };

    ensureParam('pgbouncer', 'true', url.searchParams.get('pgbouncer') !== 'true');
    ensureParam('connection_limit', String(DB_CONFIG.CONNECTION_LIMIT));
    ensureParam('pool_timeout', String(DB_CONFIG.POOL_TIMEOUT));
    ensureParam('connect_timeout', String(DB_CONFIG.CONNECT_TIMEOUT));
    ensureParam('statement_timeout', String(DB_CONFIG.STATEMENT_TIMEOUT));

    return url.toString();
  } catch (error) {
    console.warn('[db] Invalid DATABASE_URL format. Falling back to the raw value.', error);
    return databaseUrl;
  }
};
