'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { OrderStatus } from '@/types/prisma';

interface Order {
  id: string;
  orderStatus: OrderStatus;
  totalPrice: number;
  createdAt: Date;
  project: {
    id: string;
    title: string;
    thumbnail: string | null;
    status: string;
    endDate: Date | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    reward: {
      id: string;
      title: string;
      description: string | null;
      price: number;
      deliveryType: string;
      estimatedDelivery: Date | null;
    } | null;
    tickets: Array<{
      id: string;
      qrCode: string;
      seat: string | null;
      eventDate: Date | null;
      status: string;
    }>;
    shipments: Array<{
      id: string;
      carrier: string | null;
      trackingNo: string | null;
      status: string;
      shippedAt: Date | null;
      deliveredAt: Date | null;
    }>;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
}

interface OrderDetailViewProps {
  order: Order;
}

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handlePayment = async () => {
    if (!session) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: 'CARD',
          paymentData: {
            cardNumber: '4242424242424242', // 테스트 카드
            expiryDate: '12/25',
            cvv: '123'
          }
        })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.message || '결제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '미정';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* 주문 헤더 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">주문 상세</h1>
              <p className="text-white/60">주문 번호: {order.id}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)}`}>
                {getStatusText(order.orderStatus)}
              </div>
              <p className="text-white/60 text-sm mt-2">
                주문일: {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {order.totalPrice.toLocaleString()}원
              </div>
              <div className="text-white/60 text-sm">총 결제 금액</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {order.items.length}
              </div>
              <div className="text-white/60 text-sm">주문 아이템</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {order.project?.title || 'N/A'}
              </div>
              <div className="text-white/60 text-sm">프로젝트</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 주문 아이템 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">주문 아이템</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-medium">{item.reward?.title || '리워드 정보 없음'}</h3>
                      <div className="text-primary font-semibold">
                        {item.totalPrice.toLocaleString()}원
                      </div>
                    </div>
                    
                    {item.reward?.description && (
                      <p className="text-white/60 text-sm mb-2">{item.reward.description}</p>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-white/60">
                      <span>수량: {item.quantity}개</span>
                      <span>단가: {item.unitPrice.toLocaleString()}원</span>
                    </div>

                    {/* 배송 정보 */}
                    {item.shipments.length > 0 && (
                      <div className="mt-3 p-3 bg-white/5 rounded border border-white/10">
                        <h4 className="text-white font-medium mb-2">배송 정보</h4>
                        {item.shipments.map((shipment) => (
                          <div key={shipment.id} className="text-sm text-white/60">
                            <div>택배사: {shipment.carrier || '미정'}</div>
                            <div>송장번호: {shipment.trackingNo || '미정'}</div>
                            <div>상태: {shipment.status}</div>
                            {shipment.shippedAt && (
                              <div>발송일: {formatDate(shipment.shippedAt)}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 티켓 정보 */}
                    {item.tickets.length > 0 && (
                      <div className="mt-3 p-3 bg-white/5 rounded border border-white/10">
                        <h4 className="text-white font-medium mb-2">티켓 정보</h4>
                        {item.tickets.map((ticket) => (
                          <div key={ticket.id} className="text-sm text-white/60">
                            <div>QR 코드: {ticket.qrCode}</div>
                            {ticket.seat && <div>좌석: {ticket.seat}</div>}
                            {ticket.eventDate && (
                              <div>이벤트일: {formatDate(ticket.eventDate)}</div>
                            )}
                            <div>상태: {ticket.status}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 결제 내역 */}
            {order.payments.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">결제 내역</h2>
                <div className="space-y-3">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-white font-medium">
                          {payment.amount.toLocaleString()}원
                        </div>
                        <div className="text-white/60 text-sm">
                          {formatDate(payment.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          payment.status === 'SUCCEEDED' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {payment.status === 'SUCCEEDED' ? '성공' : '실패'}
                        </div>
                        <div className="text-white/60 text-xs mt-1">
                          ID: {payment.id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 결제 버튼 */}
            {order.orderStatus === OrderStatus.PENDING && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">결제하기</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {order.totalPrice.toLocaleString()}원
                    </div>
                    <div className="text-white/60 text-sm">결제 예정 금액</div>
                  </div>
                  
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? '결제 처리중...' : '결제하기'}
                  </button>
                  
                  <p className="text-white/60 text-xs text-center">
                    테스트 환경에서는 가상 결제가 진행됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* 프로젝트 정보 (프로젝트가 있는 경우에만 표시) */}
            {order.project && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">프로젝트 정보</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-white/60 text-sm">프로젝트</div>
                    <div className="text-white font-medium">{order.project.title}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">상태</div>
                    <div className="text-white">{order.project.status}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">마감일</div>
                    <div className="text-white">{formatDate(order.project.endDate)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 주문 정보 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">주문 정보</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">주문 번호</span>
                  <span className="text-white">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">주문일</span>
                  <span className="text-white">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">총 금액</span>
                  <span className="text-white font-semibold">
                    {order.totalPrice.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
