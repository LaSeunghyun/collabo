'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, DollarSign } from 'lucide-react';
import { SettlementCard } from './_components/SettlementCard';
import { useSettlementMutations } from '@/hooks/use-settlement-mutations';

// Types should be centralized
interface Settlement {
  id: string;
  netAmount: number;
  platformFee: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
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

export default function SettlementsPage() {
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

  const { updateStatus: mutateUpdateStatus } = useSettlementMutations();
  
  const updateStatus = (settlementId: string, status: string) => {
    mutateUpdateStatus({ settlementId, status });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
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

      {/* Filters */}
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

      {/* Settlements List */}
      <div className="space-y-4">
        {data?.settlements.map((settlement) => (
          <SettlementCard 
            key={settlement.id} 
            settlement={settlement} 
            onStatusUpdate={updateStatus}
          />
        ))}
      </div>

      {/* Pagination */}
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