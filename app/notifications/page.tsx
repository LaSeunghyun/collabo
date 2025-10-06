'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NotificationType } from '@/types/drizzle';
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
  [NotificationType.FUNDING_SUCCESS]: '?Ä???±Í≥µ',
  [NotificationType.NEW_COMMENT]: '???ìÍ?',
  [NotificationType.PROJECT_MILESTONE]: '?ÑÎ°ú?ùÌä∏ ÎßàÏùº?§ÌÜ§',
  [NotificationType.PARTNER_REQUEST]: '?åÌä∏???îÏ≤≠',
  [NotificationType.SETTLEMENT_PAID]: '?ïÏÇ∞ ?ÑÎ£å',
  [NotificationType.SYSTEM]: '?úÏä§???åÎ¶º'
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
        throw new Error('?åÎ¶º Î™©Î°ù??Î∂àÎü¨?????ÜÏäµ?àÎã§.');
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
        throw new Error('?åÎ¶º ?ΩÏùå Ï≤òÎ¶¨???§Ìå®?àÏäµ?àÎã§.');
      }

      toast({
        title: '?ΩÏùå Ï≤òÎ¶¨ ?ÑÎ£å',
        description: '?åÎ¶º???ΩÏùå Ï≤òÎ¶¨?òÏóà?µÎãà??',
      });

      refetch();
    } catch (error) {
      console.error('?åÎ¶º ?ΩÏùå Ï≤òÎ¶¨ ?§Ìå®:', error);
      toast({
        title: '?ΩÏùå Ï≤òÎ¶¨ ?§Ìå®',
        description: error instanceof Error ? error.message : '?åÎ¶º ?ΩÏùå Ï≤òÎ¶¨???§Ìå®?àÏäµ?àÎã§.',
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
        throw new Error('?ÑÏ≤¥ ?åÎ¶º ?ΩÏùå Ï≤òÎ¶¨???§Ìå®?àÏäµ?àÎã§.');
      }

      toast({
        title: '?ÑÏ≤¥ ?ΩÏùå Ï≤òÎ¶¨ ?ÑÎ£å',
        description: 'Î™®Îì† ?åÎ¶º???ΩÏùå Ï≤òÎ¶¨?òÏóà?µÎãà??',
      });

      refetch();
    } catch (error) {
      console.error('?ÑÏ≤¥ ?åÎ¶º ?ΩÏùå Ï≤òÎ¶¨ ?§Ìå®:', error);
      toast({
        title: '?ΩÏùå Ï≤òÎ¶¨ ?§Ìå®',
        description: error instanceof Error ? error.message : '?ÑÏ≤¥ ?åÎ¶º ?ΩÏùå Ï≤òÎ¶¨???§Ìå®?àÏäµ?àÎã§.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('?ïÎßêÎ°????åÎ¶º????†ú?òÏãúÍ≤†Ïäµ?àÍπå?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('?åÎ¶º ??†ú???§Ìå®?àÏäµ?àÎã§.');
      }

      toast({
        title: '??†ú ?ÑÎ£å',
        description: '?åÎ¶º????†ú?òÏóà?µÎãà??',
      });

      refetch();
    } catch (error) {
      console.error('?åÎ¶º ??†ú ?§Ìå®:', error);
      toast({
        title: '??†ú ?§Ìå®',
        description: error instanceof Error ? error.message : '?åÎ¶º ??†ú???§Ìå®?àÏäµ?àÎã§.',
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
          <h2 className="text-2xl font-bold text-red-600 mb-4">?§Î•ò Î∞úÏÉù</h2>
          <p className="text-gray-600">?åÎ¶º Î™©Î°ù??Î∂àÎü¨?§Îäî Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-4">?åÎ¶º</h1>
            <p className="text-gray-600">
              Î∞õÏ? ?åÎ¶º???ïÏù∏?òÍ≥† Í¥ÄÎ¶¨Ìïò?∏Ïöî.
            </p>
          </div>
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Î™®Îëê ?ΩÏùå Ï≤òÎ¶¨
          </Button>
        </div>
      </div>

      {/* ?ÑÌÑ∞ */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="?åÎ¶º Í≤Ä??.."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="?åÎ¶º ?†Ìòï" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">?ÑÏ≤¥</SelectItem>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.isRead} onValueChange={(value) => handleFilterChange('isRead', value)}>
            <SelectTrigger>
              <SelectValue placeholder="?ΩÏùå ?ÅÌÉú" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">?ÑÏ≤¥</SelectItem>
              <SelectItem value="false">?ΩÏ? ?äÏùå</SelectItem>
              <SelectItem value="true">?ΩÏùå</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch()}>
            <Filter className="h-4 w-4 mr-2" />
            ?àÎ°úÍ≥†Ïπ®
          </Button>
        </div>
      </div>

      {/* ?åÎ¶º Î™©Î°ù */}
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

              {/* Í¥Ä???ïÎ≥¥ */}
              {notification.relatedId && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    Í¥Ä??ID: {notification.relatedId}
                    {notification.relatedType && (
                      <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                        {notification.relatedType}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ?°ÏÖò Î≤ÑÌäº */}
              <div className="flex justify-end space-x-2">
                {!notification.isRead && (
                  <Button
                    variant="outline"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    ?ΩÏùå Ï≤òÎ¶¨
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(notification.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  ??†ú
                </Button>
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

      {data?.notifications.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Bell className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            ?åÎ¶º???ÜÏäµ?àÎã§
          </h3>
          <p className="text-gray-500">
            ?ÑÏßÅ Î∞õÏ? ?åÎ¶º???ÜÏäµ?àÎã§.
          </p>
        </div>
      )}
    </div>
  );
}
