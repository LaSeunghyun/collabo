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
    ensureParam('connection_limit', '1');
    ensureParam('pool_timeout', '0');

    return url.toString();
  } catch (error) {
    console.warn('[db] Invalid DATABASE_URL format. Falling back to the raw value.', error);
    return databaseUrl;
  }
};
