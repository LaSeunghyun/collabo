'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Clock, 
  CheckCircle,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

interface Settlement {
  id: string;
  totalAmount: number;
  platformFee: number;
  netAmount: number;
  status: string;
  createdAt: string;
  project: {
    id: string;
    title: string;
    status: string;
    owner: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  };
  payouts: Array<{
    id: string;
    amount: number;
    percentage: number;
    status: string;
    stakeholder: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
  }>;
}

interface SettlementsResponse {
  settlements: Settlement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const STATUS_LABELS = {
  PENDING: '대기중',
  PROCESSING: '처리중',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소됨'
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

export default function SettlementsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery<SettlementsResponse>({
    queryKey: ['settlements', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      const response = await fetch(`/api/settlements?${params}`);
      if (!response.ok) {
        throw new Error('정산 목록을 불러올 수 없습니다.');
      }
      return response.json();
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleStatusUpdate = async (settlementId: string, status: string) => {
    try {
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('정산 상태 변경에 실패했습니다.');
      }

      toast({
        title: '상태 변경 완료',
        description: '정산 상태가 변경되었습니다.',
      });

      refetch();
    } catch (error) {
      console.error('정산 상태 변경 실패:', error);
      toast({
        title: '상태 변경 실패',
        description: error instanceof Error ? error.message : '정산 상태 변경에 실패했습니다.',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-600">정산 목록을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">정산 관리</h1>
        <p className="text-gray-600">
          프로젝트 정산 현황을 확인하고 관리하세요.
        </p>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="프로젝트 검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="정산 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch()}>
            <Filter className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 정산 목록 */}
      <div className="space-y-4">
        {data?.settlements.map((settlement) => (
          <Card key={settlement.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {settlement.project.owner.avatarUrl ? (
                      <img
                        src={settlement.project.owner.avatarUrl}
                        alt={settlement.project.owner.name}
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
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(settlement.totalAmount)}
                  </div>
                  <div className="text-sm text-gray-600">총 금액</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(settlement.platformFee)}
                  </div>
                  <div className="text-sm text-gray-600">플랫폼 수수료</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(settlement.netAmount)}
                  </div>
                  <div className="text-sm text-gray-600">정산 금액</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {settlement.payouts.length}
                  </div>
                  <div className="text-sm text-gray-600">이해관계자</div>
                </div>
              </div>

              {/* 이해관계자 목록 */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">이해관계자</h4>
                {settlement.payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {payout.stakeholder.avatarUrl ? (
                          <img
                            src={payout.stakeholder.avatarUrl}
                            alt={payout.stakeholder.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 text-sm font-semibold">
                            {payout.stakeholder.name[0]}
                          </span>
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

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" asChild>
                  <Link href={`/admin/settlements/${settlement.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    상세보기
                  </Link>
                </Button>
                
                {settlement.status === 'PENDING' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(settlement.id, 'PROCESSING')}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      처리중
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(settlement.id, 'COMPLETED')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      완료
                    </Button>
                  </>
                )}
                
                {settlement.status === 'PROCESSING' && (
                  <Button
                    onClick={() => handleStatusUpdate(settlement.id, 'COMPLETED')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    완료
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 */}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          
          <span className="flex items-center px-4">
            {page} / {data.pagination.pages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPage(prev => Math.min(data.pagination.pages, prev + 1))}
            disabled={page === data.pagination.pages}
          >
            다음
          </Button>
        </div>
      )}

      {data?.settlements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <DollarSign className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            정산 내역이 없습니다
          </h3>
          <p className="text-gray-500">
            아직 정산이 생성된 프로젝트가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}