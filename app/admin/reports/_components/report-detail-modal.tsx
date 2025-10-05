'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, EyeOff, XCircle } from 'lucide-react';
import { ModerationStatus } from '@/types/prisma';

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
  } | null;
}

interface ReportDetailModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

export function ReportDetailModal({ 
  postId, 
  isOpen, 
  onClose, 
  onStatusUpdate 
}: ReportDetailModalProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');

  useEffect(() => {
    if (isOpen && postId) {
      fetchPostDetails();
    }
  }, [isOpen, postId, fetchPostDetails]);

  const fetchPostDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/moderation?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Failed to fetch post details:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const handleStatusUpdate = async (reportId: string, status: string) => {
    setProcessing(true);
    setSelectedReportId(reportId);
    
    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status,
          actionNote: actionNote || undefined
        })
      });

      if (response.ok) {
        await fetchPostDetails(); // 데이터 새로고침
        onStatusUpdate();
        onClose();
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setProcessing(false);
      setSelectedReportId(null);
      setActionNote('');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case ModerationStatus.PENDING:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case ModerationStatus.REVIEWING:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case ModerationStatus.ACTION_TAKEN:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case ModerationStatus.DISMISSED:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case ModerationStatus.PENDING:
        return '대기중';
      case ModerationStatus.REVIEWING:
        return '검토중';
      case ModerationStatus.ACTION_TAKEN:
        return '조치완료';
      case ModerationStatus.DISMISSED:
        return '기각됨';
      default:
        return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">신고된 게시글 상세</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : post ? (
            <>
              {/* 게시글 정보 */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {post.author.avatarUrl ? (
                      <img 
                        src={post.author.avatarUrl} 
                        alt={post.author.name || 'User'} 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-primary font-semibold">
                        {post.author.name?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{post.title}</h3>
                    </div>
                    <p className="text-sm text-white/60 mb-2">
                      {post.author.name || '익명'} • {formatDate(post.createdAt)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span>👍 {post._count.likes}</span>
                      <span>💬 {post._count.comments}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-white/5">
                  <p className="text-white/80 whitespace-pre-wrap">{post.content}</p>
                </div>
              </div>

              {/* 신고 목록 */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">신고 내역</h3>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-lg border border-white/5 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            신고자: {report.reporter?.name || report.reporter?.id || '익명'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                            {getStatusLabel(report.status)}
                          </span>
                        </div>
                        <span className="text-xs text-white/60">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                      
                      {report.reason && (
                        <p className="text-sm text-white/70 mb-3 p-3 rounded-lg bg-white/5">
                          {report.reason}
                        </p>
                      )}

                      {/* 처리 버튼들 */}
                      {report.status === ModerationStatus.PENDING && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleStatusUpdate(report.id, ModerationStatus.ACTION_TAKEN)}
                            disabled={processing && selectedReportId === report.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            <EyeOff className="h-4 w-4" />
                            블라인드 처리
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(report.id, ModerationStatus.DISMISSED)}
                            disabled={processing && selectedReportId === report.id}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            기각
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 처리 메모 */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">처리 메모</h3>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="처리 사유나 메모를 입력하세요..."
                  className="w-full h-24 p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/60">게시글 정보를 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
