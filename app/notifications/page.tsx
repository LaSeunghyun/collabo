'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NotificationType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Bell, 
  CheckCircle, 
  Trash2,
  MoreHorizontal
} from 'lucide-react';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: string;
  metadata: any;
  relatedId: string | null;
  relatedType: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const NOTIFICATION_TYPE_LABELS = {
  [NotificationType.FUNDING_SUCCESS]: '펀딩 성공',
  [NotificationType.NEW_COMMENT]: '새 댓글',
  [NotificationType.PROJECT_MILESTONE]: '프로젝트 마일스톤',
  [NotificationType.PARTNER_REQUEST]: '파트너 요청',
  [NotificationType.SETTLEMENT_PAID]: '정산 완료',
  [NotificationType.SYSTEM]: '시스템 알림'
};

const NOTIFICATION_TYPE_COLORS = {
  [NotificationType.FUNDING_SUCCESS]: 'bg-green-100 text-green-800',
  [NotificationType.NEW_COMMENT]: 'bg-blue-100 text-blue-800',
  [NotificationType.PROJECT_MILESTONE]: 'bg-purple-100 text-purple-800',
  [NotificationType.PARTNER_REQUEST]: 'bg-orange-100 text-orange-800',
  [NotificationType.SETTLEMENT_PAID]: 'bg-emerald-100 text-emerald-800',
  [NotificationType.SYSTEM]: 'bg-gray-100 text-gray-800'
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    type: '',
    isRead: '',
    search: ''
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('알림 목록을 불러올 수 없습니다.');
      }
      return response.json();
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'markAsRead' })
      });

      if (!response.ok) {
        throw new Error('알림 읽음 처리에 실패했습니다.');
      }

      toast({
        title: '읽음 처리 완료',
        description: '알림이 읽음 처리되었습니다.',
      });

      refetch();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      toast({
        title: '읽음 처리 실패',
        description: error instanceof Error ? error.message : '알림 읽음 처리에 실패했습니다.',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'markAllAsRead' })
      });

      if (!response.ok) {
        throw new Error('전체 알림 읽음 처리에 실패했습니다.');
      }

      toast({
        title: '전체 읽음 처리 완료',
        description: '모든 알림이 읽음 처리되었습니다.',
      });

      refetch();
    } catch (error) {
      console.error('전체 알림 읽음 처리 실패:', error);
      toast({
        title: '읽음 처리 실패',
        description: error instanceof Error ? error.message : '전체 알림 읽음 처리에 실패했습니다.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 알림을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('알림 삭제에 실패했습니다.');
      }

      toast({
        title: '삭제 완료',
        description: '알림이 삭제되었습니다.',
      });

      refetch();
    } catch (error) {
      console.error('알림 삭제 실패:', error);
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '알림 삭제에 실패했습니다.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <p className="text-gray-600">알림 목록을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-4">알림</h1>
            <p className="text-gray-600">
              받은 알림을 확인하고 관리하세요.
            </p>
          </div>
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            모두 읽음 처리
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="알림 검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="알림 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.isRead} onValueChange={(value) => handleFilterChange('isRead', value)}>
            <SelectTrigger>
              <SelectValue placeholder="읽음 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              <SelectItem value="false">읽지 않음</SelectItem>
              <SelectItem value="true">읽음</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch()}>
            <Filter className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="space-y-4">
        {data?.notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`hover:shadow-lg transition-shadow ${
              !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Bell className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <CardDescription>
                      {formatDate(notification.createdAt)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={NOTIFICATION_TYPE_COLORS[notification.type]}>
                    {NOTIFICATION_TYPE_LABELS[notification.type]}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="mb-4">
                <p className="text-gray-700">{notification.content}</p>
              </div>

              {/* 관련 정보 */}
              {notification.relatedId && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    관련 ID: {notification.relatedId}
                    {notification.relatedType && (
                      <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                        {notification.relatedType}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-2">
                {!notification.isRead && (
                  <Button
                    variant="outline"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    읽음 처리
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(notification.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
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

      {data?.notifications.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Bell className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            알림이 없습니다
          </h3>
          <p className="text-gray-500">
            아직 받은 알림이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
