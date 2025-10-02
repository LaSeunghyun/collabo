import { NextRequest, NextResponse } from 'next/server';

import { OrderStatus } from '@prisma/client';
import { requireApiUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { GuardRequirement } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { userId: user.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  project: {
                    select: {
                      id: true,
                      title: true,
                      owner: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({
      orders,
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
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request as NextRequest & GuardRequirement);
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Items are required' },
        { status: 400 }
      );
    }

    // 상품 정보 조회 및 검증
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { message: 'Some products not found' },
        { status: 400 }
      );
    }

    // 재고 확인
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { message: `Insufficient stock for product ${product?.name}` },
          { status: 400 }
        );
      }
    }

    // 주문 총액 계산
    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId)!;
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      };
    });

    const totalPrice = subtotal; // 배송비 등 추가 가능

    // 주문 생성
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        totalPrice,
        subtotal,
        status: OrderStatus.PENDING,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                project: {
                  select: {
                    id: true,
                    title: true,
                    owner: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // 재고 차감
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { message: 'Failed to create order' },
      { status: 500 }
    );
  }
}
