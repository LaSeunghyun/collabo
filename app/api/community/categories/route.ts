import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { categories } from '@/lib/db/schema/tables';
import { eq, and, desc } from 'drizzle-orm';

const createCategorySchema = z.object({
  slug: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).default(0),
});

const updateCategorySchema = createCategorySchema.partial().omit({ slug: true });

export async function GET() {
  try {
    const db = await getDbClient();
    const categoriesList = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(desc(categories.displayOrder), desc(categories.createdAt));

    return NextResponse.json({
      success: true,
      categories: categoriesList,
    });
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      { permissions: ['community:moderate'] } as GuardRequirement,
      { headers: request.headers }
    );

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // slug 중복 확인
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, validatedData.slug))
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: '이미 존재하는 슬러그입니다.' },
        { status: 400 }
      );
    }

    const newCategory = await db
      .insert(categories)
      .values({
        id: crypto.randomUUID(),
        ...validatedData,
      })
      .returning();

    return NextResponse.json({
      success: true,
      category: newCategory[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    console.error('카테고리 생성 오류:', error);
    return NextResponse.json(
      { error: '카테고리 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}