import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count, desc, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { orders, orderItems, products, orderStatusEnum } from '@/lib/db/schema';
import { getDb } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';
import { withCache, CACHE_TTL, CACHE_KEYS } from '@/lib/utils/cache';
import { measureApiTime } from '@/lib/utils/performance';

export async function GET(request: NextRequest) {
  return measureApiTime('orders-api', async () => {
    try {
      const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 조건부 필터링
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

    // 모든 주문의 아이템들을 한 번에 조회 (N+1 문제 해결)
    const orderIds = ordersList.map(order => order.id);
    const allOrderItems = orderIds.length > 0 ? await db
      .select({
        orderId: orderItems.orderId,
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
      .where(inArray(orderItems.orderId, orderIds)) : [];

    // 주문별로 아이템 그룹화
    const itemsByOrderId = new Map<string, typeof allOrderItems>();
    allOrderItems.forEach(item => {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, []);
      }
      itemsByOrderId.get(item.orderId)!.push(item);
    });

    // 주문과 아이템 결합
    const ordersWithItems = ordersList.map(order => ({
      ...order,
      items: itemsByOrderId.get(order.id) || []
    }));

    // 전체 개수 조회
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
      console.error('Failed to fetch orders:', error);
      return NextResponse.json(
        { message: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const body = await request.json();
    const { items, shippingInfo } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Items are required' },
        { status: 400 }
      );
    }

    // 상품 정보 조회 및 검증
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
        { message: 'Some products not found' },
        { status: 400 }
      );
    }

    // 재고 확인
    for (const item of items) {
      const product = productsList.find(p => p.id === item.productId);
      if (!product || (product.inventory && product.inventory < item.quantity)) {
        return NextResponse.json(
          { message: `Insufficient stock for product ${product?.name}` },
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

    const totalPrice = subtotal; // 배송비 등 추가 가능

    // 트랜잭션으로 주문 생성 및 재고 차감
    const orderId = randomUUID();

    // 주문 생성
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

    // 주문 아이템 생성
    const db = await getDb();
    const newOrderItems = await Promise.all(
      orderItemsData.map(item =>
        db.insert(orderItems).values({
          id: randomUUID(),
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }).returning()
      )
    );

    // 재고 차감
    for (const item of items) {
      const product = productsList.find(p => p.id === item.productId)!;
      if (product.inventory !== null) {
        await db
          .update(products)
          .set({ inventory: product.inventory - item.quantity })
          .where(eq(products.id, item.productId));
      }
    }

    return NextResponse.json({
      ...newOrder[0],
      items: newOrderItems.map(item => item[0])
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { message: 'Failed to create order' },
      { status: 500 }
    );
  }
}
