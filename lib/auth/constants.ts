export const DEFAULT_ROLE = 'fan' as const;

export type AppRole = typeof DEFAULT_ROLE | string;
