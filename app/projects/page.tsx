'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, Filter, ArrowRight, Calendar, Users, Target } from 'lucide-react';
import clsx from 'clsx';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  _count: {
    fundings: number;
  };
  participants: number;
  remainingDays: number;
}

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'LIVE', label: '진행중' },
  { value: 'DRAFT', label: '임시저장' },
  { value: 'REVIEWING', label: '검토중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' }
] as const;

const CATEGORY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'music', label: '음악' },
  { value: 'art', label: '미술' },
  { value: 'film', label: '영화' },
  { value: 'dance', label: '댄스' },
  { value: 'theater', label: '연극' },
  { value: 'literature', label: '문학' },
  { value: 'photography', label: '사진' },
  { value: 'design', label: '디자인' },
  { value: 'tech', label: '기술' },
  { value: 'other', label: '기타' }
] as const;

export default function ProjectsPage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [selectedStatus, selectedCategory]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus);
      }
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) {
        throw new Error('프로젝트를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('프로젝트 로드 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    return project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           project.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'text-green-400 bg-green-500/10';
      case 'DRAFT': return 'text-gray-400 bg-gray-500/10';
      case 'REVIEWING': return 'text-yellow-400 bg-yellow-500/10';
      case 'COMPLETED': return 'text-blue-400 bg-blue-500/10';
      case 'CANCELLED': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  const getCategoryLabel = (category: string) => {
    const option = CATEGORY_OPTIONS.find(opt => opt.value === category);
    return option?.label || category;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">프로젝트</h1>
            <p className="mt-2 text-white/70">아티스트와 팬이 함께 만드는 다양한 프로젝트를 탐색해보세요</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="animate-pulse">
                  <div className="h-48 w-full rounded-xl bg-white/10 mb-4" />
                  <div className="h-4 w-3/4 rounded bg-white/10 mb-2" />
                  <div className="h-3 w-1/2 rounded bg-white/10 mb-4" />
                  <div className="h-3 w-full rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">프로젝트</h1>
          <p className="mt-2 text-white/70">아티스트와 팬이 함께 만드는 다양한 프로젝트를 탐색해보세요</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="프로젝트 검색..."
                className="w-full rounded-full border border-white/10 bg-neutral-950/60 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              <Filter className="h-4 w-4" />
              필터
            </button>
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">상태</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/60 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">카테고리</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/60 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 프로젝트 목록 */}
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-red-300">{error}</p>
            <button
              onClick={loadProjects}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/60">표시할 프로젝트가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
              >
                <div className="space-y-4">
                  {/* 썸네일 */}
                  <div className="aspect-video overflow-hidden rounded-xl bg-white/5">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>

                  {/* 상태 및 카테고리 */}
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'rounded-full px-2 py-1 text-xs font-medium',
                      getStatusColor(project.status)
                    )}>
                      {getStatusLabel(project.status)}
                    </span>
                    <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/60">
                      {getCategoryLabel(project.category)}
                    </span>
                  </div>

                  {/* 제목 및 설명 */}
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary transition">
                      {project.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-white/70">
                      {project.description}
                    </p>
                  </div>

                  {/* 진행률 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">진행률</span>
                      <span className="font-semibold text-white">
                        {Math.round((project.currentAmount / project.targetAmount) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min((project.currentAmount / project.targetAmount) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">
                        {formatCurrency(project.currentAmount)} / {formatCurrency(project.targetAmount)}
                      </span>
                      <span className="text-white/60">
                        {project.remainingDays}일 남음
                      </span>
                    </div>
                  </div>

                  {/* 통계 */}
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project.participants}명 참여</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(project.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>

                  {/* 작성자 */}
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        {project.owner.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-white/60">{project.owner.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
