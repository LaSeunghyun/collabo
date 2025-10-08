import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count, desc, inArray } from 'drizzle-orm';

import { orders, orderItems, products, orderStatusEnum } from '@/lib/db/schema';
import { getDb, isDrizzleAvailable } from '@/lib/db/client';
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

    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 조건부 ?�터�?
    const conditions = [eq(orders.userId, user.id)];
    if (status && Object.values(orderStatusEnum.enumValues).includes(status as any)) {
      conditions.push(eq(orders.orderStatus, status as any));
    }

    // 주문 목록 조회
    const ordersList = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        totalPrice: orders.totalPrice,
        subtotal: orders.subtotal,
        currency: orders.currency,
        orderStatus: orders.orderStatus,
        shippingCost: orders.shippingCost,
        taxAmount: orders.taxAmount,
        discountTotal: orders.discountTotal,
        shippingInfo: orders.shippingInfo,
        transactionId: orders.transactionId,
        metadata: orders.metadata,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // �?주문???�이?�들 조회
    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            totalPrice: orderItems.totalPrice,
            product: {
              id: products.id,
              name: products.name,
              type: products.type,
              images: products.images
            }
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items
        };
      })
    );

    // ?�체 개수 조회
    const totalResult = await db
      .select({ count: count() })
      .from(orders)
      .where(and(...conditions));
    
    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('주문 목록 조회 �??�류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '주문 목록??불러?�는???�패?�습?�다.',
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
    const db = await getDb();
    
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '?�못???�청 본문?�니??' },
        { status: 400 }
      );
    }

    const { items, shippingInfo } = body as {
      items?: Array<{ productId: string; quantity: number }>;
      shippingInfo?: any;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '주문???�품???�요?�니??' },
        { status: 400 }
      );
    }

    // ?�품 ?�보 조회 �?검�?
    const productIds = items.map((item: any) => item.productId);
    const productsList = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        inventory: products.inventory,
        isActive: products.isActive
      })
      .from(products)
      .where(and(
        eq(products.isActive, true),
        inArray(products.id, productIds)
      ));

    if (productsList.length !== productIds.length) {
      return NextResponse.json(
        { error: '?��? ?�품??찾을 ???�습?�다.' },
        { status: 400 }
      );
    }

    // ?�고 ?�인
    for (const item of items) {
      const product = productsList.find(p => p.id === item.productId);
      if (!product || (product.inventory && product.inventory < item.quantity)) {
        return NextResponse.json(
          { error: `${product?.name || '?�품'}???�고가 부족합?�다.` },
          { status: 400 }
        );
      }
    }

    // 주문 총액 계산
    let subtotal = 0;
    const orderItemsData = items.map((item: any) => {
      const product = productsList.find(p => p.id === item.productId)!;
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      };
    });

    const totalPrice = subtotal; // 배송�???추�? 가??

    // ?�랜??��?�로 주문 ?�성 �??�고 차감
    const orderId = crypto.randomUUID();
    
    // 주문 ?�성
    const newOrder = await db
      .insert(orders)
      .values({
        id: orderId,
        userId: user.id,
        totalPrice,
        subtotal,
        currency: 'KRW',
        orderStatus: 'PENDING',
        shippingInfo: shippingInfo || null
      })
      .returning();

    // 주문 ?�이???�성
    const newOrderItems = await Promise.all(
      orderItemsData.map(item => 
        db.insert(orderItems).values({
          id: crypto.randomUUID(),
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }).returning()
      )
    );

    // ?�고 차감
    for (const item of items) {
      const product = productsList.find(p => p.id === item.productId)!;
      if (product.inventory !== null) {
        await db
          .update(products)
          .set({ inventory: product.inventory - item.quantity })
          .where(eq(products.id, item.productId));
      }
    }

    if (!newOrder[0]) {
      throw new Error('주문 ?�성???�패?�습?�다.');
    }

    return NextResponse.json({
      ...newOrder[0],
      items: newOrderItems.map(item => item[0])
    }, { status: 201 });
  } catch (error) {
    console.error('주문 ?�성 �??�류 발생:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: '주문 ?�성???�패?�습?�다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
