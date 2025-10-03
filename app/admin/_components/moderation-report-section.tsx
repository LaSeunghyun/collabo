'use client';

import { useState } from 'react';
import {
  ModerationStatus,
  ModerationTargetType,
  type ModerationStatusValue,
  type ModerationTargetTypeValue
} from '@/types/prisma';

const statusLabels: Record<ModerationStatusValue, string> = {
  [ModerationStatus.PENDING]: '대기중',
  [ModerationStatus.REVIEWING]: '검토중',
  [ModerationStatus.ACTION_TAKEN]: '조치완료',
  [ModerationStatus.DISMISSED]: '기각됨'
};

const targetLabels: Record<ModerationTargetTypeValue, string> = {
  [ModerationTargetType.POST]: '게시글',
  [ModerationTargetType.COMMENT]: '댓글'
} as const satisfies Record<ModerationTargetTypeValue, string>;

const getTargetLabel = (type: ModerationTargetTypeValue) => targetLabels[type];

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

interface ModerationReport {
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

interface ModerationReportSectionProps {
  reports: ModerationReport[];
  handledReports: any[];
}

export function ModerationReportSection({ reports, handledReports }: ModerationReportSectionProps) {
  const [processingReports, setProcessingReports] = useState<Set<string>>(new Set());
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');

  const handleReportAction = async (reportId: string, action: 'blind' | 'dismiss' | 'reviewing') => {
    setProcessingReports(prev => new Set(prev).add(reportId));
    
    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          action,
          reason: actionReason || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('신고 처리에 실패했습니다.');
      }

      // 성공 시 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('신고 처리 오류:', error);
      alert('신고 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
      setSelectedReport(null);
      setActionReason('');
    }
  };

  return (
    <section
      id="moderation"
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
    >
      <header>
        <p className="text-xs uppercase tracking-wider text-primary/60">신고 대응</p>
        <h2 className="mt-1 text-lg font-semibold text-white">조치가 필요한 신고</h2>
        <p className="mt-2 text-sm text-white/60">
          새로 제출된 신고를 검토하고 빠르게 대응하여 커뮤니티를 건강하게 유지해주세요.
        </p>
      </header>

      {reports.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex items-start justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
            >
              <div className="pr-4 flex-1">
                <p className="text-sm font-medium text-white">
                  {getTargetLabel(report.targetType)} #{report.targetId}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  제출일 {dateFormatter.format(report.createdAt)}
                  {report.reporter ? (
                    <span className="whitespace-nowrap">
                      {' | 신고자 '}
                      {report.reporter.name ?? report.reporter.id}
                    </span>
                  ) : null}
                </p>
                {report.reason ? (
                  <p className="mt-2 line-clamp-2 text-xs text-white/70">{report.reason}</p>
                ) : null}
                
                {/* 신고 처리 버튼들 */}
                {report.status === ModerationStatus.PENDING && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setSelectedReport(report.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      disabled={processingReports.has(report.id)}
                    >
                      검토하기
                    </button>
                    <button
                      onClick={() => handleReportAction(report.id, 'blind')}
                      className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      disabled={processingReports.has(report.id)}
                    >
                      블라인드
                    </button>
                    <button
                      onClick={() => handleReportAction(report.id, 'dismiss')}
                      className="rounded-lg bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                      disabled={processingReports.has(report.id)}
                    >
                      기각
                    </button>
                  </div>
                )}
              </div>
              <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                {statusLabels[report.status]}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
          검토 대기 중인 신고가 없습니다.
        </p>
      )}

      {/* 검토 모달 */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <h3 className="text-lg font-semibold text-white">신고 검토</h3>
            <p className="mt-2 text-sm text-white/60">
              이 신고를 검토 상태로 변경하시겠습니까?
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="검토 사유 (선택사항)"
              className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/50"
              rows={3}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleReportAction(selectedReport, 'reviewing')}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                disabled={processingReports.has(selectedReport)}
              >
                검토 시작
              </button>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setActionReason('');
                }}
                className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">해결된 사건</h3>
            <p className="mt-1 text-xs text-white/60">
              완료된 조치가 있는 게시물들입니다.
            </p>
          </div>
        </div>
        
        {handledReports.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {handledReports.map((report) => (
              <li
                key={report.id}
                className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
              >
                <p className="text-xs text-white/70">
                  {getTargetLabel(report.targetType)} #{report.targetId} - {statusLabels[report.status as ModerationStatusValue]}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            아직 해결된 신고가 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}