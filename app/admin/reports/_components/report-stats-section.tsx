'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';

interface ReportStats {
  total: number;
  pending: number;
  completed: number;
}

interface ReportStatsSectionProps {
  stats: ReportStats;
}

export function ReportStatsSection({ stats }: ReportStatsSectionProps) {
  const router = useRouter();

  const statCards = [
    {
      title: '전체 신고',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: '처리 대기중',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      title: '처리 완료',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`rounded-2xl border ${card.borderColor} ${card.bgColor} p-6 cursor-pointer hover:scale-105 transition-transform`}
            onClick={() => router.push(`/admin/reports?status=${card.title === '전체 신고' ? 'all' : card.title === '처리 대기중' ? 'pending' : 'completed'}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`rounded-full p-3 ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <button className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                상세 보기 →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
