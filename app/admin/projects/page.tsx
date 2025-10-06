'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ProjectStatusType } from '@/types/drizzle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatusType;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  _count: {
    fundings: number;
    orders: number;
  };
}

interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const STATUS_LABELS = {
  'DRAFT': 'Ï¥àÏïà/Í≤Ä???ÄÍ∏∞Ï§ë',
  'PRELAUNCH': '?ÑÎ¶¨?∞Ïπò',
  'LIVE': 'ÏßÑÌñâÏ§?,
  'SUCCEEDED': '?±Í≥µ',
  'FAILED': '?§Ìå®',
  'SETTLING': '?ïÏÇ∞Ï§?,
  'EXECUTING': '?§ÌñâÏ§?,
  'COMPLETED': '?ÑÎ£å',
  'CANCELLED': 'Ï∑®ÏÜå??
};

const STATUS_COLORS = {
  'DRAFT': 'bg-yellow-100 text-yellow-800',
  'PRELAUNCH': 'bg-blue-100 text-blue-800',
  'LIVE': 'bg-green-100 text-green-800',
  'SUCCEEDED': 'bg-emerald-100 text-emerald-800',
  'FAILED': 'bg-red-100 text-red-800',
  'SETTLING': 'bg-purple-100 text-purple-800',
  'EXECUTING': 'bg-orange-100 text-orange-800',
  'COMPLETED': 'bg-indigo-100 text-indigo-800',
  'CANCELLED': 'bg-gray-100 text-gray-800'
};

export default function AdminProjectsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery<ProjectsResponse>({
    queryKey: ['admin-projects', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      const response = await fetch(`/api/projects?${params}`);
      if (!response.ok) {
        throw new Error('?ÑÎ°ú?ùÌä∏ Î™©Î°ù??Î∂àÎü¨?????ÜÏäµ?àÎã§.');
      }
      return response.json();
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleStatusUpdate = async (projectId: string, status: ProjectStatusType) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('?ÑÎ°ú?ùÌä∏ ?ÅÌÉú Î≥ÄÍ≤ΩÏóê ?§Ìå®?àÏäµ?àÎã§.');
      }

      toast({
        title: '?ÅÌÉú Î≥ÄÍ≤??ÑÎ£å',
        description: '?ÑÎ°ú?ùÌä∏ ?ÅÌÉúÍ∞Ä Î≥ÄÍ≤ΩÎêò?àÏäµ?àÎã§.',
      });

      refetch();
    } catch (error) {
      console.error('?ÑÎ°ú?ùÌä∏ ?ÅÌÉú Î≥ÄÍ≤??§Ìå®:', error);
      toast({
        title: '?ÅÌÉú Î≥ÄÍ≤??§Ìå®',
        description: error instanceof Error ? error.message : '?ÑÎ°ú?ùÌä∏ ?ÅÌÉú Î≥ÄÍ≤ΩÏóê ?§Ìå®?àÏäµ?àÎã§.',
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

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
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
          <h2 className="text-2xl font-bold text-red-600 mb-4">?§Î•ò Î∞úÏÉù</h2>
          <p className="text-gray-600">?ÑÎ°ú?ùÌä∏ Î™©Î°ù??Î∂àÎü¨?§Îäî Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">?ÑÎ°ú?ùÌä∏ Í≤Ä??/h1>
        <p className="text-gray-600">
          Í≤Ä???ÄÍ∏?Ï§ëÏù∏ ?ÑÎ°ú?ùÌä∏Î•??ïÏù∏?òÍ≥† ?πÏù∏/Í±∞Î?Î•?Ï≤òÎ¶¨?òÏÑ∏??
        </p>
      </div>

      {/* ?ÑÌÑ∞ */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="?ÑÎ°ú?ùÌä∏ Í≤Ä??.."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="?ÅÌÉú" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">?ÑÏ≤¥</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch()}>
            <Filter className="h-4 w-4 mr-2" />
            ?àÎ°úÍ≥†Ïπ®
          </Button>
        </div>
      </div>

      {/* ?ÑÎ°ú?ùÌä∏ Î™©Î°ù */}
      <div className="space-y-4">
        {data?.projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {project.owner.avatarUrl ? (
                      <Image
                        src={project.owner.avatarUrl}
                        alt={project.owner.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {project.owner.name?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription>
                      {project.owner.name} ??{new Date(project.createdAt).toLocaleDateString('ko-KR')}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={STATUS_COLORS[project.status]}>
                    {STATUS_LABELS[project.status]}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="mb-4">
                <p className="text-gray-700 line-clamp-2">{project.description}</p>
              </div>

              {/* ÏßÑÌñâÎ•?Î∞?*/}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>ÏßÑÌñâÎ•?/span>
                  <span>{getProgressPercentage(project.currentAmount, project.targetAmount).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(project.currentAmount, project.targetAmount)}%` }}
                  ></div>
                </div>
              </div>

              {/* ?µÍ≥Ñ */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(project.currentAmount)}
                  </div>
                  <div className="text-sm text-gray-600">?ÑÏû¨ Î™®Í∏à??/div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(project.targetAmount)}
                  </div>
                  <div className="text-sm text-gray-600">Î™©Ìëú Í∏àÏï°</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {project._count.fundings}
                  </div>
                  <div className="text-sm text-gray-600">?Ä??Ï∞∏Ïó¨??/div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {project._count.orders}
                  </div>
                  <div className="text-sm text-gray-600">Ï£ºÎ¨∏ ??/div>
                </div>
              </div>

              {/* ?°ÏÖò Î≤ÑÌäº */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" asChild>
                  <Link href={`/projects/${project.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    ?ÅÏÑ∏Î≥¥Í∏∞
                  </Link>
                </Button>
                
                {project.status === 'DRAFT' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(project.id, 'PRELAUNCH')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      ?πÏù∏
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(project.id, 'CANCELLED')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Í±∞Î?
                    </Button>
                  </>
                )}
                
                {project.status === 'PRELAUNCH' && (
                  <Button
                    onClick={() => handleStatusUpdate(project.id, 'LIVE')}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    ?∞Ïπ≠
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ?òÏù¥ÏßÄ?§Ïù¥??*/}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            ?¥Ï†Ñ
          </Button>
          
          <span className="flex items-center px-4">
            {page} / {data.pagination.pages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPage(prev => Math.min(data.pagination.pages, prev + 1))}
            disabled={page === data.pagination.pages}
          >
            ?§Ïùå
          </Button>
        </div>
      )}

      {data?.projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Í≤Ä?†Ìï† ?ÑÎ°ú?ùÌä∏Í∞Ä ?ÜÏäµ?àÎã§
          </h3>
          <p className="text-gray-500">
            ?ÑÏû¨ Í≤Ä???ÄÍ∏?Ï§ëÏù∏ ?ÑÎ°ú?ùÌä∏Í∞Ä ?ÜÏäµ?àÎã§.
          </p>
        </div>
      )}
    </div>
  );
}
