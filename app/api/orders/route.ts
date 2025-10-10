import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count, desc, inArray } from 'drizzle-orm';

import { orders, orderItems, products, orderStatusEnum } from '@/lib/db/schema';
import { getDb, isDrizzleAvailable } from '@/lib/db/client';
import { requireApiUser } from '@/lib/auth/guards';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // ?°ì´?°ë² ?´ìŠ¤ ?¬ìš© ê°€???¬ë? ?•ì¸
    if (!isDrizzleAvailable()) {
      return NextResponse.json(
        { 
          error: '?°ì´?°ë² ?´ìŠ¤???°ê²°?????†ìŠµ?ˆë‹¤.',
          details: 'DATABASE_URL???¤ì •?˜ì? ?Šì•˜?µë‹ˆ??'
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

    // ì¡°ê±´ë¶€ ?„í„°ë§?
    const conditions = [eq(orders.userId, user.id)];
    if (status && Object.values(orderStatusEnum.enumValues).includes(status as any)) {
      conditions.push(eq(orders.orderStatus, status as any));
    }

    // ì£¼ë¬¸ ëª©ë¡ ì¡°íšŒ
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

    // ê°?ì£¼ë¬¸???„ì´?œë“¤ ì¡°íšŒ
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

    // ?„ì²´ ê°œìˆ˜ ì¡°íšŒ
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
    console.error('ì£¼ë¬¸ ëª©ë¡ ì¡°íšŒ ì¤??¤ë¥˜ ë°œìƒ:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'ì£¼ë¬¸ ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ?°ì´?°ë² ?´ìŠ¤ ?¬ìš© ê°€???¬ë? ?•ì¸
    if (!isDrizzleAvailable()) {
      return NextResponse.json(
        { 
          error: '?°ì´?°ë² ?´ìŠ¤???°ê²°?????†ìŠµ?ˆë‹¤.',
          details: 'DATABASE_URL???¤ì •?˜ì? ?Šì•˜?µë‹ˆ??'
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
        { error: '?˜ëª»???”ì²­ ë³¸ë¬¸?…ë‹ˆ??' },
        { status: 400 }
      );
    }

    const { items, shippingInfo } = body as {
      items?: Array<{ productId: string; quantity: number }>;
      shippingInfo?: any;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'ì£¼ë¬¸???í’ˆ???„ìš”?©ë‹ˆ??' },
        { status: 400 }
      );
    }

    // ?í’ˆ ?•ë³´ ì¡°íšŒ ë°?ê²€ì¦?
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
        { error: '?¼ë? ?í’ˆ??ì°¾ì„ ???†ìŠµ?ˆë‹¤.' },
        { status: 400 }
      );
    }

    // ?¬ê³  ?•ì¸
    for (const item of items) {
      const product = productsList.find(p => p.id === item.productId);
      if (!product || (product.inventory && product.inventory < item.quantity)) {
        return NextResponse.json(
          { error: `${product?.name || '?í’ˆ'}???¬ê³ ê°€ ë¶€ì¡±í•©?ˆë‹¤.` },
          { status: 400 }
        );
      }
    }

    // ì£¼ë¬¸ ì´ì•¡ ê³„ì‚°
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

    const totalPrice = subtotal; // ë°°ì†¡ë¹???ì¶”ê? ê°€ê²?

    // ?¸ëœ??…˜?¼ë¡œ ì£¼ë¬¸ ?ì„± ë°??¬ê³  ì°¨ê°
    const orderId = crypto.randomUUID();
    
    // ì£¼ë¬¸ ?ì„±
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

    // ì£¼ë¬¸ ?„ì´???ì„±
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

    // ?¬ê³  ì°¨ê°
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
      throw new Error('ì£¼ë¬¸ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }

    return NextResponse.json({
      ...newOrder[0],
      items: newOrderItems.map(item => item[0])
    }, { status: 201 });
  } catch (error) {
    console.error('ì£¼ë¬¸ ?ì„± ì¤??¤ë¥˜ ë°œìƒ:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.headers.get('user-id') || 'unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'ì£¼ë¬¸ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
