'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PartnerType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Star, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Partner {
  id: string;
  type: PartnerType;
  name: string;
  description: string | null;
  contactInfo: string;
  location: string | null;
  portfolioUrl: string | null;
  verified: boolean;
  rating: number | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  _count: {
    partnerMatches: number;
  };
}

interface PartnersResponse {
  partners: Partner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const PARTNER_TYPE_LABELS = {
  [PartnerType.STUDIO]: '스튜디오',
  [PartnerType.VENUE]: '공연장',
  [PartnerType.PRODUCTION]: '제작 스튜디오',
  [PartnerType.MERCHANDISE]: '머천다이즈',
  [PartnerType.OTHER]: '기타'
};

export default function PartnersPage() {
  const [filters, setFilters] = useState({
    type: '',
    verified: '',
    location: '',
    search: ''
  });

  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<PartnersResponse>({
    queryKey: ['partners', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      const response = await fetch(`/api/partners?${params}`);
      if (!response.ok) {
        throw new Error('파트너 목록을 불러올 수 없습니다.');
      }
      return response.json();
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
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
          <p className="text-gray-600">파트너 목록을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">파트너 찾기</h1>
        <p className="text-gray-600 mb-6">
          프로젝트에 필요한 전문 파트너를 찾아보세요.
        </p>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="파트너 검색..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="파트너 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {Object.entries(PARTNER_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.verified} onValueChange={(value) => handleFilterChange('verified', value)}>
              <SelectTrigger>
                <SelectValue placeholder="인증 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                <SelectItem value="true">인증됨</SelectItem>
                <SelectItem value="false">미인증</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="지역 검색"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 파트너 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {data?.partners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {partner.user.avatarUrl ? (
                      <Image
                        src={partner.user.avatarUrl}
                        alt={partner.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {partner.user.name?.[0] || 'P'}
                      </span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{partner.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {PARTNER_TYPE_LABELS[partner.type]}
                      </Badge>
                      {partner.verified && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          인증됨
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {partner.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{partner.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {partner.description && (
                <CardDescription className="mb-4 line-clamp-3">
                  {partner.description}
                </CardDescription>
              )}
              
              <div className="space-y-2 mb-4">
                {partner.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {partner.location}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {partner._count.partnerMatches}개 프로젝트 참여
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(partner.createdAt).toLocaleDateString('ko-KR')} 등록
                </div>
              </div>

              <div className="flex space-x-2">
                <Button asChild className="flex-1">
                  <Link href={`/partners/${partner.id}`}>
                    상세보기
                  </Link>
                </Button>
                {partner.portfolioUrl && (
                  <Button variant="outline" asChild>
                    <a href={partner.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      포트폴리오
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 */}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
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

      {data?.partners.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            파트너를 찾을 수 없습니다
          </h3>
          <p className="text-gray-500">
            다른 검색 조건을 시도해보세요.
          </p>
        </div>
      )}
    </div>
  );
}