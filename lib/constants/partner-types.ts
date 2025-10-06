export const PartnerType = {
  STUDIO: 'STUDIO',
  VENUE: 'VENUE',
  PRODUCTION: 'PRODUCTION',
  MERCHANDISE: 'MERCHANDISE',
  OTHER: 'OTHER'
} as const;

export type PartnerTypeValue = (typeof PartnerType)[keyof typeof PartnerType];

export const PARTNER_TYPE_VALUES = Object.values(PartnerType);

export const PARTNER_TYPE_LABELS: Record<PartnerTypeValue, string> = {
  [PartnerType.STUDIO]: '?§Ìäú?îÏò§',
  [PartnerType.VENUE]: 'Í≥µÏó∞??,
  [PartnerType.PRODUCTION]: '?úÏûë ?§Ìäú?îÏò§',
  [PartnerType.MERCHANDISE]: 'Î®∏Ï≤ú?§Ïù¥Ï¶?,
  [PartnerType.OTHER]: 'Í∏∞Ì?'
};
