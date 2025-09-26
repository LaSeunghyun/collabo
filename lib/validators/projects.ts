import { ProjectStatus } from '@prisma/client';
import { z } from 'zod';

const currencySchema = z
  .string({ message: '통화 코드는 필수입니다.' })
  .trim()
  .min(3, '통화 코드는 3자리여야 합니다.')
  .max(3, '통화 코드는 3자리여야 합니다.')
  .transform((value) => value.toUpperCase());

const nullableDateSchema = z
  .union([z.coerce.date(), z.null()])
  .optional();

const jsonLikeSchema = z.unknown().optional();

const baseProjectSchema = z
  .object({
    title: z
      .string({ message: '프로젝트 제목은 필수입니다.' })
      .trim()
      .min(1, '프로젝트 제목은 1자 이상이어야 합니다.')
      .max(120, '프로젝트 제목은 120자를 넘을 수 없습니다.'),
    description: z
      .string({ message: '프로젝트 설명은 필수입니다.' })
      .trim()
      .min(1, '프로젝트 설명은 1자 이상이어야 합니다.'),
    category: z
      .string({ message: '카테고리는 필수입니다.' })
      .trim()
      .min(1, '카테고리는 1자 이상이어야 합니다.')
      .max(60, '카테고리는 60자를 넘을 수 없습니다.'),
    targetAmount: z
      .coerce
      .number({ message: '목표 금액은 필수입니다.' })
      .int('목표 금액은 정수여야 합니다.')
      .positive('목표 금액은 0보다 커야 합니다.'),
    currency: currencySchema.optional().default('KRW'),
    startDate: nullableDateSchema,
    endDate: nullableDateSchema,
    rewardTiers: jsonLikeSchema,
    milestones: jsonLikeSchema,
    thumbnail: z
      .string()
      .url('썸네일 URL이 유효하지 않습니다.')
      .or(z.literal(''))
      .or(z.null())
      .optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    ownerId: z.string().cuid().optional()
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) {
        return true;
      }

      if (data.endDate < data.startDate) {
        return false;
      }

      return true;
    },
    {
      message: '종료일은 시작일 이후여야 합니다.',
      path: ['endDate']
    }
  );

export const createProjectSchema = baseProjectSchema.omit({ status: true });

export const updateProjectSchema = baseProjectSchema
  .extend({
    targetAmount: baseProjectSchema.shape.targetAmount.optional(),
    title: baseProjectSchema.shape.title.optional(),
    description: baseProjectSchema.shape.description.optional(),
    category: baseProjectSchema.shape.category.optional(),
    currency: currencySchema.optional(),
    thumbnail: baseProjectSchema.shape.thumbnail,
    status: z.nativeEnum(ProjectStatus).optional()
  })
  .partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
