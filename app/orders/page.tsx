'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { OrderStatus } from '@/types/drizzle';

interface Order {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: Date;
  paidAt: Date | null;
  project: {
    id: string;
    title: string;
    thumbnail: string | null;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    reward: {
      id: string;
      title: string;
      price: number;
    };
  }>;
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?status=${filter === 'all' ? '' : filter}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [fetchOrders, status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">로그인이 필요합니다</h1>
          <Link
            href="/auth/signin"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-500/20 text-yellow-400';
      case OrderStatus.PAID_PENDING_CAPTURE: return 'bg-blue-500/20 text-blue-400';
      case OrderStatus.PAID: return 'bg-green-500/20 text-green-400';
      case OrderStatus.SHIPPED: return 'bg-purple-500/20 text-purple-400';
      case OrderStatus.DELIVERED: return 'bg-green-500/20 text-green-400';
      case OrderStatus.REFUNDED: return 'bg-red-500/20 text-red-400';
      case OrderStatus.CANCELLED: return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return '결제 대기중';
      case OrderStatus.PAID_PENDING_CAPTURE: return '결제 확인중';
      case OrderStatus.PAID: return '결제 완료';
      case OrderStatus.SHIPPED: return '배송중';
      case OrderStatus.DELIVERED: return '배송 완료';
      case OrderStatus.REFUNDED: return '환불됨';
      case OrderStatus.CANCELLED: return '취소됨';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">내 주문</h1>
          <p className="text-white/60 mb-6">
            주문 내역을 확인하고 관리하세요.
          </p>
          
          <div className="flex gap-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'PENDING', label: '결제 대기' },
              { key: 'PAID', label: '결제 완료' },
              { key: 'SHIPPED', label: '배송중' },
              { key: 'DELIVERED', label: '배송 완료' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {order.project.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">
                      주문일: {formatDate(order.createdAt)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      {order.totalPrice.toLocaleString()}원
                    </div>
                    <div className="text-white/60 text-sm">
                      {order.orderItems.length}개 아이템
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">주문 아이템</h4>
                    <div className="space-y-2">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-white/80">{item.reward.title}</span>
                          <span className="text-white/60">
                            {item.quantity}개 × {item.reward.price.toLocaleString()}원
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white/60 text-sm mb-1">주문 번호</div>
                    <div className="text-white font-mono text-sm">{order.id}</div>
                    {order.paidAt && (
                      <>
                        <div className="text-white/60 text-sm mb-1 mt-2">결제일</div>
                        <div className="text-white text-sm">{formatDate(order.paidAt)}</div>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {!loading && orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60 mb-4">주문 내역이 없습니다.</p>
            <Link
              href="/projects"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
            >
              프로젝트 둘러보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
