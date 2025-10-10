import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count, desc } from 'drizzle-orm';

import { products, projects, productTypeEnum } from '@/lib/db/schema';
import { getDbClient, isDrizzleAvailable } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // ?�이?�베?�스 ?�용 가???��? ?�인
    if (!isDrizzleAvailable()) {
      return NextResponse.json(
        { 
          error: '?�이?�베?�스???�결?????�습?�다.',
          details: 'DATABASE_URL???�정?��? ?�았?�니??'
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

    // 조건부 ?�터�?
    const conditions = [];
    if (projectId) {
      conditions.push(eq(products.projectId, projectId));
    }
    if (type && Object.values(productTypeEnum.enumValues).includes(type as any)) {
      conditions.push(eq(products.type, type as any));
    }

    // ?�품 목록 조회
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

    // ?�체 개수 조회
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
    console.error('?�품 목록 조회 �??�류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: '?�품 목록??불러?�는???�패?�습?�다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ?�이?�베?�스 ?�용 가???��? ?�인
    if (!isDrizzleAvailable()) {
      return NextResponse.json(
        { 
          error: '?�이?�베?�스???�결?????�습?�다.',
          details: 'DATABASE_URL???�정?��? ?�았?�니??'
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
        { error: '?�못???�청 본문?�니??' },
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
        { error: '?�로?�트 ID, ?�품�? ?�?? 가격�? ?�수?�니??' },
        { status: 400 }
      );
    }

    // ?�로?�트 존재 ?�인
    const project = await db
      .select({ id: projects.id, ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!project) {
      return NextResponse.json(
        { error: '?�로?�트�?찾을 ???�습?�다.' },
        { status: 404 }
      );
    }

    // 권한 ?�인 (?�로?�트 ?�유???�는 관리자)
    if (project.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '???�로?�트???�품??추�???권한???�습?�다.' },
        { status: 403 }
      );
    }

    // ?�품 ?�성
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
      throw new Error('?�품 ?�성???�패?�습?�다.');
    }

    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error) {
    console.error('?�품 ?�성 �??�류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '?�품 ?�성???�패?�습?�다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
