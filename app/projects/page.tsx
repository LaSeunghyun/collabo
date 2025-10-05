'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  endDate: string | null;
  thumbnail: string | null;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  _count: {
    fundings: number;
    rewards: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects?status=${filter === 'all' ? '' : filter}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-500/20 text-green-400';
      case 'SUCCEEDED': return 'bg-blue-500/20 text-blue-400';
      case 'FAILED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'LIVE': return '진행중';
      case 'SUCCEEDED': return '성공';
      case 'FAILED': return '실패';
      case 'DRAFT': return '준비중';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">프로젝트</h1>
          <p className="text-white/60 mb-6">
            아티스트들의 창작 프로젝트를 둘러보고 후원해보세요.
          </p>
          
          <div className="flex gap-4 mb-6">
            <Link
              href="/projects/create"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
            >
              프로젝트 생성
            </Link>
            
            <div className="flex gap-2">
              {[
                { key: 'all', label: '전체' },
                { key: 'LIVE', label: '진행중' },
                { key: 'SUCCEEDED', label: '성공' },
                { key: 'FAILED', label: '실패' }
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
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = Math.min((project.currentAmount / project.targetAmount) * 100, 100);
              const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
              
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-colors"
                >
                  {project.thumbnail && (
                    <div className="mb-4">
                      <img 
                        src={project.thumbnail} 
                        alt={project.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-white/20 text-white rounded text-xs">
                      {project.category}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/80 text-sm">진행률</span>
                      <span className="text-white font-semibold text-sm">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-white/60">모금액</div>
                      <div className="text-white font-semibold">
                        {project.currentAmount.toLocaleString()}원
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60">목표액</div>
                      <div className="text-white font-semibold">
                        {project.targetAmount.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        {project.owner.avatarUrl ? (
                          <img 
                            src={project.owner.avatarUrl} 
                            alt={project.owner.name} 
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <span className="text-primary text-xs font-semibold">
                            {project.owner.name[0]}
                          </span>
                        )}
                      </div>
                      <span className="text-white/80 text-sm">{project.owner.name}</span>
                    </div>
                    <div className="text-white/60 text-sm">
                      {daysLeft > 0 ? `${daysLeft}일 남음` : '종료'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">프로젝트가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
