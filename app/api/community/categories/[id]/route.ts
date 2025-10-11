import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { getDbClient } from '@/lib/db/client';
import { categories } from '@/lib/db/schema/tables';
import { eq } from 'drizzle-orm';

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      { permissions: ['community:moderate'] } as GuardRequirement,
      { headers: request.headers }
    );

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const updatedCategory = await db
      .update(categories)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, params.id))
      .returning();

    if (updatedCategory.length === 0) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category: updatedCategory[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    console.error('카테고리 수정 오류:', error);
    return NextResponse.json(
      { error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDbClient();
    const user = await requireApiUser(
      { permissions: ['community:moderate'] } as GuardRequirement,
      { headers: request.headers }
    );

    // 소프트 삭제 (비활성화)
    const updatedCategory = await db
      .update(categories)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, params.id))
      .returning();

    if (updatedCategory.length === 0) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '카테고리가 비활성화되었습니다.',
    });
  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    return NextResponse.json(
      { error: '카테고리 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
