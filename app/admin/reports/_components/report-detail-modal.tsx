'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
// import { ModerationStatus } from '@/types/shared'; // TODO: Drizzle 전환 필요

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

interface Report {
  id: string;
  reason: string | null;
  status: string;
  createdAt: Date;
  reporter: {
    id: string;
    name: string | null;
  };
}

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
  onStatusUpdate: (reportId: string, status: string) => void;
}

const statusLabels: Record<string, string> = {
  'PENDING': '대기중',
  'REVIEWING': '검토중',
  'ACTION_TAKEN': '조치완료',
  'DISMISSED': '기각됨'
};

const reasonLabels: Record<string, string> = {
  'SPAM': '스팸',
  'HARASSMENT': '괴롭힘',
  'INAPPROPRIATE_CONTENT': '부적절한 내용',
  'VIOLENCE': '폭력',
  'HATE_SPEECH': '혐오 발언',
  'COPYRIGHT': '저작권 침해',
  'OTHER': '기타'
};

export function ReportDetailModal({ isOpen, onClose, reportId, onStatusUpdate }: ReportDetailModalProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchReportDetails = useCallback(async () => {
    if (!reportId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
        setPost(data.post);
      }
    } catch (error) {
      console.error('신고 상세 정보 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (isOpen && reportId) {
      fetchReportDetails();
    }
  }, [isOpen, reportId, fetchReportDetails]);

  const handleStatusUpdate = async (status: string) => {
    if (!reportId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        onStatusUpdate(reportId, status);
        onClose();
      }
    } catch (error) {
      console.error('신고 상태 업데이트 실패:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">신고 상세 정보</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          </div>
        ) : report && post ? (
          <div className="space-y-6">
            {/* 신고 정보 */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-4 text-lg font-semibold text-white">신고 정보</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-white/60">신고 ID</label>
                  <p className="text-white">{report.id}</p>
                </div>
                <div>
                  <label className="text-sm text-white/60">신고 사유</label>
                  <p className="text-white">
                    {report.reason ? reasonLabels[report.reason] || report.reason : '미지정'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/60">신고 상태</label>
                  <p className="text-white">{statusLabels[report.status] || report.status}</p>
                </div>
                <div>
                  <label className="text-sm text-white/60">신고일</label>
                  <p className="text-white">
                    {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/60">신고자</label>
                  <p className="text-white">{report.reporter.name || '익명'}</p>
                </div>
              </div>
            </div>

            {/* 게시글 정보 */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-4 text-lg font-semibold text-white">게시글 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60">제목</label>
                  <p className="text-white">{post.title}</p>
                </div>
                <div>
                  <label className="text-sm text-white/60">작성자</label>
                  <div className="flex items-center space-x-3">
                    {post.author.avatarUrl ? (
                      <Image
                        src={post.author.avatarUrl}
                        alt={post.author.name || '작성자'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-white/20"></div>
                    )}
                    <span className="text-white">{post.author.name || '익명'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60">작성일</label>
                  <p className="text-white">
                    {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/60">내용</label>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-white whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-white/60">좋아요:</span>
                    <span className="text-white">{post._count.likes}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-white/60">댓글:</span>
                    <span className="text-white">{post._count.comments}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            {report.status === 'PENDING' && (
              <div className="flex space-x-3">
                <button
                  onClick={() => handleStatusUpdate('REVIEWING')}
                  disabled={isUpdating}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? '처리중...' : '검토 시작'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('ACTION_TAKEN')}
                  disabled={isUpdating}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isUpdating ? '처리중...' : '조치 완료'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('DISMISSED')}
                  disabled={isUpdating}
                  className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {isUpdating ? '처리중...' : '기각'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-white/60">신고 정보를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}