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
  [PartnerType.STUDIO]: '스튜디오',
  [PartnerType.VENUE]: '공연장',
  [PartnerType.PRODUCTION]: '제작 스튜디오',
  [PartnerType.MERCHANDISE]: '머천다이즈',
  [PartnerType.OTHER]: '기타'
};
