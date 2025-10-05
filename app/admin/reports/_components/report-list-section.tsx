'use client';

import { useState } from 'react';
import { 
  ModerationStatus, 
  ModerationTargetType,
  type ModerationStatusValue,
  type ModerationTargetTypeValue 
} from '@/types/prisma';
import { ReportDetailModal } from './report-detail-modal';

const statusLabels: Record<ModerationStatusValue, string> = {
  [ModerationStatus.PENDING]: '대기중',
  [ModerationStatus.REVIEWING]: '검토중',
  [ModerationStatus.ACTION_TAKEN]: '조치완료',
  [ModerationStatus.DISMISSED]: '기각됨'
};

const targetLabels: Record<ModerationTargetTypeValue, string> = {
  [ModerationTargetType.POST]: '게시글',
  [ModerationTargetType.COMMENT]: '댓글'
};

const statusColors: Record<ModerationStatusValue, string> = {
  [ModerationStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  [ModerationStatus.REVIEWING]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  [ModerationStatus.ACTION_TAKEN]: 'bg-green-500/20 text-green-400 border-green-500/30',
  [ModerationStatus.DISMISSED]: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

interface ModerationReportSummary {
  id: string;
  targetType: ModerationTargetTypeValue;
  targetId: string;
  status: ModerationStatusValue;
  reason: string | null;
  createdAt: Date;
  reporter: {
    id: string;
    name: string | null;
  } | null;
}

interface ReportListSectionProps {
  reports: ModerationReportSummary[];
}

export function ReportListSection({ reports }: ReportListSectionProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    if (filter === 'pending') {
      return report.status === ModerationStatus.PENDING || report.status === ModerationStatus.REVIEWING;
    }
    if (filter === 'completed') {
      return report.status === ModerationStatus.ACTION_TAKEN || report.status === ModerationStatus.DISMISSED;
    }
    return true;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const handleViewDetails = (postId: string) => {
    setSelectedPostId(postId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPostId(null);
  };

  const handleStatusUpdate = () => {
    // 모달이 닫힌 후 데이터 새로고침을 위해 페이지 리로드
    window.location.reload();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">신고 목록</h2>
        <p className="mt-1 text-sm text-white/60">
          신고된 내용을 검토하고 적절한 조치를 취하세요.
        </p>
      </div>

      {/* 필터 버튼 */}
      <div className="mb-6 flex gap-2">
        {[
          { key: 'all', label: '전체', count: reports.length },
          { 
            key: 'pending', 
            label: '처리 대기중', 
            count: reports.filter(r => r.status === ModerationStatus.PENDING || r.status === ModerationStatus.REVIEWING).length 
          },
          { 
            key: 'completed', 
            label: '처리 완료', 
            count: reports.filter(r => r.status === ModerationStatus.ACTION_TAKEN || r.status === ModerationStatus.DISMISSED).length 
          }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* 신고 리스트 */}
      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-white">
                      {targetLabels[report.targetType]} #{report.targetId}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[report.status]}`}>
                      {statusLabels[report.status]}
                    </span>
                  </div>
                  
                  <div className="text-sm text-white/60 mb-2">
                    <p>신고일: {formatDate(report.createdAt)}</p>
                    {report.reporter && (
                      <p>신고자: {report.reporter.name || report.reporter.id}</p>
                    )}
                  </div>
                  
                  {report.reason && (
                    <p className="text-sm text-white/80 bg-white/5 rounded-lg p-3 mt-2">
                      {report.reason}
                    </p>
                  )}
                </div>
                
                <div className="ml-4 flex gap-2">
                  <button 
                    onClick={() => handleViewDetails(report.targetId)}
                    className="px-3 py-1 text-xs font-medium text-white/60 hover:text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    상세보기
                  </button>
                  {report.status === ModerationStatus.PENDING && (
                    <button 
                      onClick={() => handleViewDetails(report.targetId)}
                      className="px-3 py-1 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/80 transition-colors"
                    >
                      처리하기
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">
              {filter === 'all' ? '신고가 없습니다.' : 
               filter === 'pending' ? '처리 대기중인 신고가 없습니다.' : 
               '처리 완료된 신고가 없습니다.'}
            </p>
          </div>
        )}
      </div>

      {/* 신고 상세 모달 */}
      {selectedPostId && (
        <ReportDetailModal
          postId={selectedPostId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
