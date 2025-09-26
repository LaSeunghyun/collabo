import { PartnerType } from '@/types/prisma';

import { createPartnerSchema, updatePartnerSchema } from '@/lib/validators/partners';

describe('createPartnerSchema', () => {
  it('normalizes service tags', () => {
    const payload = {
      name: 'Studio Aurora',
      type: PartnerType.STUDIO,
      contactInfo: 'hello@aurora.studio',
      services: [' 녹음 ', '믹싱', '녹음']
    };

    const parsed = createPartnerSchema.parse(payload);
    expect(parsed.services).toEqual(['녹음', '믹싱']);
  });

  it('rejects invalid URLs', () => {
    const payload = {
      name: 'Studio Aurora',
      type: PartnerType.STUDIO,
      contactInfo: 'hello@aurora.studio',
      portfolioUrl: 'not-a-url'
    };

    expect(() => createPartnerSchema.parse(payload)).toThrowError();
  });
});

describe('updatePartnerSchema', () => {
  it('requires at least one field', () => {
    expect(() => updatePartnerSchema.parse({})).toThrowError();
  });

  it('allows clearing optional fields', () => {
    const parsed = updatePartnerSchema.parse({
      description: null,
      services: null,
      portfolioUrl: null
    });

    expect(parsed.description).toBeNull();
    expect(parsed.services).toBeNull();
    expect(parsed.portfolioUrl).toBeNull();
  });
});
