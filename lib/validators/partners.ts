import { PartnerType } from '@prisma/client';
import { z } from 'zod';

export const PARTNER_TYPE_VALUES = Object.values(PartnerType);

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  [PartnerType.STUDIO]: '스튜디오',
  [PartnerType.VENUE]: '공연장',
  [PartnerType.PRODUCTION]: '제작 스튜디오',
  [PartnerType.MERCHANDISE]: '머천다이즈',
  [PartnerType.OTHER]: '기타'
};

const serviceTagSchema = z.string().trim().min(1).max(80);

const availabilitySlotSchema = z.object({
  day: z.string().trim().min(1).max(24),
  start: z.string().trim().min(1).max(20),
  end: z.string().trim().min(1).max(20),
  note: z.string().trim().max(160).optional()
});

export const partnerAvailabilitySchema = z
  .object({
    timezone: z.string().trim().min(1).max(80).optional(),
    slots: z.array(availabilitySlotSchema).max(32).optional()
  })
  .refine(
    (value: z.infer<typeof partnerAvailabilitySchema>) => {
      if (!value) {
        return true;
      }

      if (!value.timezone && !value.slots?.length) {
        return false;
      }

      return true;
    },
    { message: '가용 시간대 정보는 타임존 또는 슬롯 중 하나 이상을 포함해야 합니다.' }
  );

const servicesArraySchema = z
  .array(serviceTagSchema)
  .max(12)
  .transform((items: string[]) => {
    const cleaned = items.map((item: string) => item.trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
  });

export const createPartnerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.nativeEnum(PartnerType),
  description: z.string().trim().max(2000).optional(),
  contactInfo: z.string().trim().min(3).max(160),
  services: servicesArraySchema.optional(),
  pricingModel: z.string().trim().min(2).max(160).optional(),
  location: z.string().trim().min(2).max(160).optional(),
  availability: partnerAvailabilitySchema.optional(),
  portfolioUrl: z.string().trim().url().max(200).optional(),
  ownerId: z.string().cuid().optional(),
  verified: z.boolean().optional()
});

export const updatePartnerSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    type: z.nativeEnum(PartnerType).optional(),
    description: z.string().trim().max(2000).nullish(),
    contactInfo: z.string().trim().min(3).max(160).optional(),
    services: servicesArraySchema.optional().nullish(),
    pricingModel: z.string().trim().min(2).max(160).optional().nullish(),
    location: z.string().trim().min(2).max(160).optional().nullish(),
    availability: partnerAvailabilitySchema.optional().nullish(),
    portfolioUrl: z.string().trim().url().max(200).optional().nullish(),
    verified: z.boolean().optional(),
    rating: z.number().min(0).max(5).optional()
  })
  .refine((value: z.infer<typeof updatePartnerSchema>) => Object.keys(value).length > 0, {
    message: '업데이트할 필드를 한 가지 이상 포함해야 합니다.'
  });

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
export type PartnerAvailabilityInput = z.infer<typeof partnerAvailabilitySchema>;
