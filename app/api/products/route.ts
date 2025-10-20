import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count, desc } from 'drizzle-orm';

import { products, projects, productTypeEnum } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 조건부 필터링
    const conditions = [];
    if (projectId) {
      conditions.push(eq(products.projectId, projectId));
    }
    if (type && Object.values(productTypeEnum.enumValues).includes(type as any)) {
      conditions.push(eq(products.type, type as any));
    }

    // 상품 목록과 개수를 한 번에 조회 (최적화)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 메인 쿼리와 카운트 쿼리를 병렬로 실행
    const [productsList, totalResult] = await Promise.all([
      // 상품 목록 조회
      (async () => {
        let productsQuery = db
          .select({
            id: products.id,
            projectId: products.projectId,
            name: products.name,
            type: products.type,
            price: products.price,
            currency: products.currency,
            inventory: products.inventory,
            images: products.images,
            isActive: products.isActive,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
            project: {
              id: projects.id,
              title: projects.title,
              status: projects.status
            }
          })
          .from(products)
          .innerJoin(projects, eq(products.projectId, projects.id));

        if (whereClause) {
          productsQuery = productsQuery.where(whereClause);
        }

        return productsQuery
          .orderBy(desc(products.createdAt))
          .limit(limit)
          .offset(offset);
      })(),
      
      // 전체 개수 조회
      (async () => {
        let countQuery = db.select({ count: count() }).from(products);
        if (whereClause) {
          countQuery = countQuery.where(whereClause);
        }
        return countQuery;
      })()
    ]);
    
    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      products: productsList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();
    const body = await request.json();
    const { projectId, name, type, price, inventory, images, sku } = body;

    if (!projectId || !name || !type || !price) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 타입 유효성 검사
    if (!Object.values(productTypeEnum.enumValues).includes(type)) {
      return NextResponse.json(
        { message: 'Invalid product type' },
        { status: 400 }
      );
    }

    // 프로젝트 소유자인지 확인
    const project = await db
      .select({ id: projects.id, ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project[0] || project[0].ownerId !== user.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 상품 생성
    const normalizedPrice = typeof price === 'string' ? Number.parseInt(price, 10) : Number(price);
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      return NextResponse.json(
        { message: 'Invalid product price' },
        { status: 400 }
      );
    }

    const normalizedInventory =
      inventory === undefined || inventory === null
        ? null
        : typeof inventory === 'string'
          ? Number.parseInt(inventory, 10)
          : Number(inventory);

    if (normalizedInventory !== null && Number.isNaN(normalizedInventory)) {
      return NextResponse.json(
        { message: 'Invalid inventory value' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const [newProduct] = await db
      .insert(products)
      .values({
        id: randomUUID(),
        projectId,
        name,
        type: type as any,
        price: normalizedPrice,
        inventory: normalizedInventory,
        images: images || [],
        sku: sku || null,
        isActive: true,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { message: 'Failed to create product' },
      { status: 500 }
    );
  }
}
