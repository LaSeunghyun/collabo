'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Package, 
  Ticket, 
  Truck, 
  CheckCircle, 
  Eye,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';

interface Shipment {
  id: string;
  carrier: string;
  trackingNo: string | null;
  status: string;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  estimatedDelivery: Date | null;
  notes: string | null;
  order: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
    project: {
      id: string;
      title: string;
      status: string;
    };
  };
}

interface Ticket {
  id: string;
  qrCode: string;
  seat: string | null;
  eventDate: Date;
  venue: string;
  status: string;
  usedAt: Date | null;
  cancelledAt: Date | null;
  notes: string | null;
  order: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
    project: {
      id: string;
      title: string;
      status: string;
    };
  };
  reward: {
    id: string;
    title: string;
    description: string;
  };
}

interface FulfillmentResponse {
  shipments: Shipment[];
  tickets: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const STATUS_LABELS = {
  PENDING: '?ÄÍ∏∞Ï§ë',
  SHIPPED: 'Î∞∞ÏÜ°Ï§?,
  DELIVERED: 'Î∞∞ÏÜ°?ÑÎ£å',
  FAILED: 'Î∞∞ÏÜ°?§Ìå®',
  CANCELLED: 'Ï∑®ÏÜå??,
  ACTIVE: '?úÏÑ±',
  USED: '?¨Ïö©??,
  EXPIRED: 'ÎßåÎ£å??
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  USED: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-red-100 text-red-800'
};

export default function FulfillmentPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    type: 'all'
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery<FulfillmentResponse>({
    queryKey: ['fulfillment', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      const response = await fetch(`/api/fulfillment?${params}`);
      if (!response.ok) {
        throw new Error('?¥Ìñâ ?ÑÌô©??Î∂àÎü¨?????ÜÏäµ?àÎã§.');
      }
      return response.json();
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleStatusUpdate = async (id: string, type: 'shipment' | 'ticket', status: string) => {
    try {
      const endpoint = type === 'shipment' ? `/api/fulfillment/shipments/${id}` : `/api/fulfillment/tickets/${id}`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('?ÅÌÉú Î≥ÄÍ≤ΩÏóê ?§Ìå®?àÏäµ?àÎã§.');
      }

      toast({
        title: '?ÅÌÉú Î≥ÄÍ≤??ÑÎ£å',
        description: '?ÅÌÉúÍ∞Ä Î≥ÄÍ≤ΩÎêò?àÏäµ?àÎã§.',
      });

      refetch();
    } catch (error) {
      console.error('?ÅÌÉú Î≥ÄÍ≤??§Ìå®:', error);
      toast({
        title: '?ÅÌÉú Î≥ÄÍ≤??§Ìå®',
        description: error instanceof Error ? error.message : '?ÅÌÉú Î≥ÄÍ≤ΩÏóê ?§Ìå®?àÏäµ?àÎã§.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (date: Date | null) => {
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
          <h2 className="text-2xl font-bold text-red-600 mb-4">?§Î•ò Î∞úÏÉù</h2>
          <p className="text-gray-600">?¥Ìñâ ?ÑÌô©??Î∂àÎü¨?§Îäî Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Î¶¨Ïõå???¥Ìñâ Í¥ÄÎ¶?/h1>
        <p className="text-gray-600">
          Î∞∞ÏÜ° Î∞??∞Ïºì ?¥Ìñâ ?ÑÌô©???ïÏù∏?òÍ≥† Í¥ÄÎ¶¨Ìïò?∏Ïöî.
        </p>
      </div>

      {/* ?ÑÌÑ∞ */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="?ÑÎ°ú?ùÌä∏ ?êÎäî ?¨Ïö©??Í≤Ä??.."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="?†Ìòï" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">?ÑÏ≤¥</SelectItem>
              <SelectItem value="shipment">Î∞∞ÏÜ°</SelectItem>
              <SelectItem value="ticket">?∞Ïºì</SelectItem>
            </SelectContent>
          </Select>

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

      {/* Î∞∞ÏÜ° Î™©Î°ù */}
      {(!filters.type || filters.type === 'all' || filters.type === 'shipment') && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Î∞∞ÏÜ° ?ÑÌô©
          </h2>
          <div className="space-y-4">
            {data?.shipments.map((shipment) => (
              <Card key={shipment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {shipment.order.user.avatarUrl ? (
                          <Image
                            src={shipment.order.user.avatarUrl}
                            alt={shipment.order.user.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold">
                            {shipment.order.user.name[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{shipment.order.project.title}</CardTitle>
                        <CardDescription>
                          {shipment.order.user.name} ??{shipment.carrier}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={STATUS_COLORS[shipment.status as keyof typeof STATUS_COLORS]}>
                        {STATUS_LABELS[shipment.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">?¥ÏÜ°?•Î≤à??/div>
                      <div className="font-medium">{shipment.trackingNo || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Î∞∞ÏÜ°??/div>
                      <div className="font-medium">{formatDate(shipment.shippedAt)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">?ÑÎ£å??/div>
                      <div className="font-medium">{formatDate(shipment.deliveredAt)}</div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" asChild>
                      <Link href={`/admin/fulfillment/shipments/${shipment.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        ?ÅÏÑ∏Î≥¥Í∏∞
                      </Link>
                    </Button>
                    
                    {shipment.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate(shipment.id, 'shipment', 'SHIPPED')}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Î∞∞ÏÜ°?úÏûë
                      </Button>
                    )}
                    
                    {shipment.status === 'SHIPPED' && (
                      <Button
                        onClick={() => handleStatusUpdate(shipment.id, 'shipment', 'DELIVERED')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Î∞∞ÏÜ°?ÑÎ£å
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ?∞Ïºì Î™©Î°ù */}
      {(!filters.type || filters.type === 'all' || filters.type === 'ticket') && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Ticket className="h-5 w-5 mr-2" />
            ?∞Ïºì ?ÑÌô©
          </h2>
          <div className="space-y-4">
            {data?.tickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {ticket.order.user.avatarUrl ? (
                          <Image
                            src={ticket.order.user.avatarUrl}
                            alt={ticket.order.user.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold">
                            {ticket.order.user.name[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{ticket.reward.title}</CardTitle>
                        <CardDescription>
                          {ticket.order.user.name} ??{ticket.venue}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]}>
                        {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">?¥Î≤§???†Ïßú</div>
                      <div className="font-medium">{formatDate(ticket.eventDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Ï¢åÏÑù</div>
                      <div className="font-medium">{ticket.seat || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">QR ÏΩîÎìú</div>
                      <div className="font-medium font-mono text-sm">{ticket.qrCode}</div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" asChild>
                      <Link href={`/admin/fulfillment/tickets/${ticket.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        ?ÅÏÑ∏Î≥¥Í∏∞
                      </Link>
                    </Button>
                    
                    {ticket.status === 'ACTIVE' && (
                      <Button
                        onClick={() => handleStatusUpdate(ticket.id, 'ticket', 'USED')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        ?¨Ïö©?ÑÎ£å
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ?òÏù¥ÏßÄ?§Ïù¥??*/}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
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

      {data?.shipments.length === 0 && data?.tickets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            ?¥Ìñâ ?¥Ïó≠???ÜÏäµ?àÎã§
          </h3>
          <p className="text-gray-500">
            ?ÑÏßÅ ?¥Ìñâ???ÑÏöî??Ï£ºÎ¨∏???ÜÏäµ?àÎã§.
          </p>
        </div>
      )}
    </div>
  );
}
