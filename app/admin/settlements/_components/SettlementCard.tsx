'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards';
import { Badge } from '@/components/ui/badge';
import { Eye, MoreHorizontal, Clock, CheckCircle } from 'lucide-react';

// These types should ideally be defined in a central place, e.g., '@/types/settlement.d.ts'
interface Settlement {
  id: string;
  netAmount: number;
  platformFee: number;
  status: string;
  createdAt: string;
  project: {
    id: string;
    title: string;
    owner: {
      name: string;
      avatarUrl: string | null;
    };
  };
  payouts: Array<{
    id: string;
    amount: number;
    percentage: number;
    stakeholder: {
      name: string;
      email: string;
      avatarUrl: string | null;
    };
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  PROCESSING: '처리중',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소됨',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};

interface SettlementCardProps {
  settlement: Settlement;
  onStatusUpdate: (settlementId: string, status: string) => void;
}

export function SettlementCard({ settlement, onStatusUpdate }: SettlementCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {settlement.project.owner.avatarUrl ? (
                <Image
                  src={settlement.project.owner.avatarUrl}
                  alt={settlement.project.owner.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-semibold">
                  {settlement.project.owner.name?.[0] || 'U'}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{settlement.project.title}</CardTitle>
              <CardDescription>
                {settlement.project.owner.name} • {new Date(settlement.createdAt).toLocaleDateString('ko-KR')}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={STATUS_COLORS[settlement.status as keyof typeof STATUS_COLORS]}>
              {STATUS_LABELS[settlement.status as keyof typeof STATUS_LABELS]}
            </Badge>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(settlement.netAmount)}</div>
            <div className="text-sm text-gray-600">총 금액</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(settlement.platformFee)}</div>
            <div className="text-sm text-gray-600">플랫폼 수수료</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(settlement.netAmount)}</div>
            <div className="text-sm text-gray-600">정산 금액</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{settlement.payouts.length}</div>
            <div className="text-sm text-gray-600">이해관계자</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">이해관계자</h4>
          {settlement.payouts.map((payout) => (
            <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {payout.stakeholder.avatarUrl ? (
                    <Image
                      src={payout.stakeholder.avatarUrl}
                      alt={payout.stakeholder.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 text-sm font-semibold">{payout.stakeholder.name[0]}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium">{payout.stakeholder.name}</div>
                  <div className="text-sm text-gray-600">{payout.stakeholder.email}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(payout.amount)}</div>
                <div className="text-sm text-gray-600">{payout.percentage}%</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" asChild>
            <Link href={`/admin/settlements/${settlement.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              상세보기
            </Link>
          </Button>

          {settlement.status === 'PENDING' && (
            <>
              <Button variant="outline" onClick={() => onStatusUpdate(settlement.id, 'PROCESSING')}>
                <Clock className="h-4 w-4 mr-2" />
                처리중
              </Button>
              <Button onClick={() => onStatusUpdate(settlement.id, 'COMPLETED')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                완료
              </Button>
            </>
          )}

          {settlement.status === 'PROCESSING' && (
            <Button onClick={() => onStatusUpdate(settlement.id, 'COMPLETED')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              완료
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
