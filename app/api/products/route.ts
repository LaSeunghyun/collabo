import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count, desc } from 'drizzle-orm';

import { products, projects, productTypeEnum } from '@/lib/db/schema';
import { getDbClient, isDrizzleAvailable } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // 데이터베이스 사용 가능 여부 확인
    if (!isDrizzleAvailable()) {
      return NextResponse.json(
        { 
          error: '데이터베이스에 연결할 수 없습니다.',
          details: 'DATABASE_URL이 설정되지 않았습니다.'
        },
        { status: 503 }
      );
    }

    const db = await getDbClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 조건부 필터
    const conditions = [];
    if (projectId) {
      conditions.push(eq(products.projectId, projectId));
    }
    if (type && Object.values(productTypeEnum.enumValues).includes(type as any)) {
      conditions.push(eq(products.type, type as any));
    }

    // 상품 목록 조회
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let productsQuery = db
      .select({
        id: products.id,
        projectId: products.projectId,
        name: products.name,
        type: products.type,
        price: products.price,
        currency: products.currency,
        description: products.description,
        images: products.images,
        inventory: products.inventory,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        project: {
          id: projects.id,
          title: projects.title,
          ownerId: projects.ownerId
        }
      })
      .from(products)
      .leftJoin(projects, eq(products.projectId, projects.id))
      .orderBy(desc(products.createdAt));

    if (whereClause) {
      productsQuery = productsQuery.where(whereClause);
    }

    const productsList = await productsQuery
      .limit(limit)
      .offset(offset);

    // 전체 개수 조회
    let countQuery = db
      .select({ count: count() })
      .from(products);

    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }

    const totalResult = await countQuery;
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
    console.error('상품 목록 조회 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: '상품 목록을 불러오는데 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 데이터베이스 사용 가능 여부 확인
    if (!isDrizzleAvailable()) {
      return NextResponse.json(
        { 
          error: '데이터베이스에 연결할 수 없습니다.',
          details: 'DATABASE_URL이 설정되지 않았습니다.'
        },
        { status: 503 }
      );
    }

    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDbClient();
    
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 본문입니다.' },
        { status: 400 }
      );
    }

    const { 
      projectId, 
      name, 
      type, 
      price, 
      currency = 'KRW', 
      description, 
      images, 
      inventory 
    } = body as {
      projectId?: string;
      name?: string;
      type?: string;
      price?: number;
      currency?: string;
      description?: string;
      images?: string[];
      inventory?: number;
    };

    if (!projectId || !name || !type || !price) {
      return NextResponse.json(
        { error: '프로젝트 ID, 상품명, 타입, 가격은 필수입니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 존재 확인
    const project = await db
      .select({ id: projects.id, ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (프로젝트 소유자이거나 관리자)
    if (project.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '해당 프로젝트에 상품을 추가할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 상품 생성
    const newProduct = await db
      .insert(products)
      .values({
        id: randomUUID(),
        projectId,
        name,
        type: type as any,
        price,
        currency,
        description: description || null,
        images: images || [],
        inventory: inventory || null,
        isActive: true
      })
      .returning();

    if (!newProduct[0]) {
      throw new Error('상품 생성에 실패했습니다.');
    }

    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error) {
    console.error('상품 생성 오류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '상품 생성에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}