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
  [PartnerType.STUDIO]: '?�튜?�오',
  [PartnerType.VENUE]: '공연??,
  [PartnerType.PRODUCTION]: '?�작 ?�튜?�오',
  [PartnerType.MERCHANDISE]: '머천?�이�?,
  [PartnerType.OTHER]: '기�?'
};
