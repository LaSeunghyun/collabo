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
  Megaphone, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Pin,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface AnnouncementsResponse {
  announcements: Announcement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const CATEGORY_LABELS = {
  GENERAL: '일반',
  UPDATE: '업데이트',
  MAINTENANCE: '점검',
  EVENT: '이벤트',
  NOTICE: '공지'
};

const CATEGORY_COLORS = {
  GENERAL: 'bg-gray-100 text-gray-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  EVENT: 'bg-green-100 text-green-800',
  NOTICE: 'bg-red-100 text-red-800'
};

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    status: ''
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery<AnnouncementsResponse>({
    queryKey: ['admin-announcements', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      const response = await fetch(`/api/announcements?${params}`);
      if (!response.ok) {
        throw new Error('공지 목록을 불러올 수 없습니다.');
      }
      return response.json();
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 공지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('공지 삭제에 실패했습니다.');
      }

      toast({
        title: '삭제 완료',
        description: '공지가 삭제되었습니다.',
      });

      refetch();
    } catch (error) {
      console.error('공지 삭제 실패:', error);
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '공지 삭제에 실패했습니다.',
        variant: 'destructive'
      });
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPinned: !isPinned })
      });

      if (!response.ok) {
        throw new Error('고정 상태 변경에 실패했습니다.');
      }

      toast({
        title: '상태 변경 완료',
        description: isPinned ? '고정이 해제되었습니다.' : '공지가 고정되었습니다.',
      });

      refetch();
    } catch (error) {
      console.error('고정 상태 변경 실패:', error);
      toast({
        title: '상태 변경 실패',
        description: error instanceof Error ? error.message : '고정 상태 변경에 실패했습니다.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR');
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
          <p className="text-gray-600">공지 목록을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-4">공지 관리</h1>
            <p className="text-gray-600">
              플랫폼 공지를 작성하고 관리하세요.
            </p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            새 공지 작성 (준비 중)
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="공지 검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              <SelectItem value="published">발행됨</SelectItem>
              <SelectItem value="scheduled">예약됨</SelectItem>
              <SelectItem value="draft">초안</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch()}>
            <Filter className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 공지 목록 */}
      <div className="space-y-4">
        {data?.announcements.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {announcement.author.avatarUrl ? (
                      <img
                        src={announcement.author.avatarUrl}
                        alt={announcement.author.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {announcement.author.name?.[0] || 'A'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      {announcement.isPinned && (
                        <Pin className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <CardDescription>
                      {announcement.author.name} • {formatDate(announcement.createdAt)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={CATEGORY_COLORS[announcement.category as keyof typeof CATEGORY_COLORS]}>
                    {CATEGORY_LABELS[announcement.category as keyof typeof CATEGORY_LABELS]}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="mb-4">
                <p className="text-gray-700 line-clamp-3">{announcement.content}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>발행일: {formatDate(announcement.publishedAt)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>예약일: {formatDate(announcement.scheduledAt)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Pin className="h-4 w-4 mr-2" />
                  <span>{announcement.isPinned ? '고정됨' : '일반'}</span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" asChild>
                  <Link href={`/announcements/${announcement.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    보기
                  </Link>
                </Button>
                
                <Button
                  variant="outline"
                  disabled
                >
                  <Edit className="h-4 w-4 mr-2" />
                  수정 (준비 중)
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleTogglePin(announcement.id, announcement.isPinned)}
                >
                  <Pin className="h-4 w-4 mr-2" />
                  {announcement.isPinned ? '고정해제' : '고정'}
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(announcement.id)}
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

      {data?.announcements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Megaphone className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            공지가 없습니다
          </h3>
          <p className="text-gray-500">
            아직 작성된 공지가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}