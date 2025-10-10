'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Users, Target, Heart, Share2, Flag } from 'lucide-react';
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

export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('프로젝트를 찾을 수 없습니다.');
        }
        throw new Error('프로젝트를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setProject(data);
    } catch (err) {
      console.error('프로젝트 로드 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
    switch (status) {
      case 'LIVE': return '진행중';
      case 'DRAFT': return '임시저장';
      case 'REVIEWING': return '검토중';
      case 'COMPLETED': return '완료';
      case 'CANCELLED': return '취소';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      music: '음악',
      art: '미술',
      film: '영화',
      dance: '댄스',
      theater: '연극',
      literature: '문학',
      photography: '사진',
      design: '디자인',
      tech: '기술',
      other: '기타'
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-white/10" />
            <div className="h-4 w-32 rounded bg-white/10" />
          </div>
          <div className="space-y-6">
            <div className="h-64 w-full rounded-2xl bg-white/10" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-white/10" />
              <div className="h-4 w-1/2 rounded bg-white/10" />
              <div className="h-32 w-full rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-4 rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-white">
          <h1 className="text-2xl font-semibold">프로젝트를 찾을 수 없습니다</h1>
          <p className="text-sm text-white/70">
            {error || '요청하신 프로젝트가 존재하지 않거나 삭제되었습니다.'}
          </p>
          <div className="flex gap-4">
            <Link
              href="/projects"
              className="rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
            >
              프로젝트 목록으로 돌아가기
            </Link>
            <button
              onClick={loadProject}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* 뒤로가기 */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          프로젝트 목록으로 돌아가기
        </Link>

        {/* 프로젝트 정보 */}
        <div className="space-y-6">
          {/* 썸네일 */}
          <div className="aspect-video overflow-hidden rounded-2xl bg-white/5">
            <img
              src={project.thumbnail}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* 헤더 정보 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={clsx(
                'rounded-full px-3 py-1 text-sm font-medium',
                getStatusColor(project.status)
              )}>
                {getStatusLabel(project.status)}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/60">
                {getCategoryLabel(project.category)}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-white">{project.title}</h1>

            <div className="flex items-center gap-4 text-sm text-white/60">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(project.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{project.participants}명 참여</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{project.remainingDays}일 남음</span>
              </div>
            </div>
          </div>

          {/* 진행률 */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">펀딩 진행률</h2>
              <span className="text-2xl font-bold text-white">
                {Math.round((project.currentAmount / project.targetAmount) * 100)}%
              </span>
            </div>
            
            <div className="h-3 w-full rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-primary transition-all"
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
                목표까지 {formatCurrency(project.targetAmount - project.currentAmount)}
              </span>
            </div>
          </div>

          {/* 프로젝트 설명 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">프로젝트 소개</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/80 leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </div>
          </div>

          {/* 작성자 정보 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">프로젝트 창작자</h3>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-white">
                  {project.owner.name.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-white">{project.owner.name}</h4>
                <p className="text-sm text-white/60">프로젝트 창작자</p>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
              <Heart className="h-4 w-4" />
              후원하기
            </button>
            <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10">
              <Share2 className="h-4 w-4" />
              공유하기
            </button>
            <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white transition hover:bg-white/10">
              <Flag className="h-4 w-4" />
              신고하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
