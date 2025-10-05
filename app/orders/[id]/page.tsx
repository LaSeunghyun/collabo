import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { OrderDetailView } from './_components/order-detail-view';

interface OrderPageProps {
  params: { id: string };
}

async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
          status: true,
          endDate: true
        }
      },
      items: {
        include: {
          reward: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              deliveryType: true,
              estimatedDelivery: true
            }
          },
          tickets: true,
          shipments: true
        }
      },
      payments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return order;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  return <OrderDetailView order={order} />;
}
