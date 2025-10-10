'use client';

import { useState } from 'react';

interface ProjectDetailTabsProps {
  project: {
    id: string;
    title: string;
    description: string;
    content: string;
    targetAmount: number;
    currentAmount: number;
    category: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  settlements?: any[];
  updates?: any[];
  comments?: any[];
}

export function ProjectDetailTabs({ project, settlements = [], updates = [], comments = [] }: ProjectDetailTabsProps) {
  const [current, setCurrent] = useState('overview');

  const tabItems = [
    { id: 'overview', label: 'ê°œìš”' },
    { id: 'updates', label: '?…ë°?´íŠ¸' },
    { id: 'comments', label: '?“ê?' },
    { id: 'settlements', label: '?•ì‚° ?´ì—­' }
  ];

  const progressPercentage = (project.currentAmount / project.targetAmount) * 100;
  const remainingAmount = project.targetAmount - project.currentAmount;

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 rounded-full bg-white/5 p-2 mb-6">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrent(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              current === tab.id
                ? 'bg-white text-black'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {current === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">?„ë¡œ?íŠ¸ ê°œìš”</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-2">?¤ëª…</h4>
                  <p className="text-white/80 leading-relaxed">{project.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white/60 mb-2">?ì„¸ ?´ìš©</h4>
                  <div className="text-white/80 leading-relaxed whitespace-pre-wrap">
                    {project.content}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">?€???„í™©</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">ëª©í‘œ ê¸ˆì•¡</span>
                  <span className="text-white font-medium">{formatCurrency(project.targetAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">?„ì¬ ëª¨ì§‘ ê¸ˆì•¡</span>
                  <span className="text-white font-medium">{formatCurrency(project.currentAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">?¨ì? ê¸ˆì•¡</span>
                  <span className="text-white font-medium">{formatCurrency(remainingAmount)}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="text-center text-sm text-white/60">
                  {progressPercentage.toFixed(1)}% ?¬ì„±
                </div>
              </div>
            </div>
          </div>
        )}

        {current === 'updates' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">?„ë¡œ?íŠ¸ ?…ë°?´íŠ¸</h3>
            {updates.length > 0 ? (
              updates.map((update) => (
                <div key={update.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium">{update.title}</h4>
                      <span className="text-sm text-white/60">{formatDate(update.createdAt)}</span>
                    </div>
                    <p className="text-white/80 leading-relaxed">{update.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
                <p className="text-white/60">?„ì§ ?…ë°?´íŠ¸ê°€ ?†ìŠµ?ˆë‹¤.</p>
              </div>
            )}
          </div>
        )}

        {current === 'comments' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">?“ê?</h3>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{comment.author?.name || '?µëª…'}</span>
                      <span className="text-sm text-white/60">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-white/80 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
                <p className="text-white/60">?„ì§ ?“ê????†ìŠµ?ˆë‹¤.</p>
              </div>
            )}
          </div>
        )}

        {current === 'settlements' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">?•ì‚° ?´ì—­</h3>
            {settlements.length > 0 ? (
              settlements.map((settlement) => (
                <div key={settlement.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">?•ì‚° #{settlement.id.slice(0, 8)}</span>
                      <span className="text-sm text-white/60">{formatDate(settlement.createdAt)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">ì´?ëª¨ì§‘ê¸ˆì•¡:</span>
                        <span className="text-white ml-2">{formatCurrency(settlement.totalRaised)}</span>
                      </div>
                      <div>
                        <span className="text-white/60">?•ì‚°ê¸ˆì•¡:</span>
                        <span className="text-white ml-2">{formatCurrency(settlement.netAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
                <p className="text-white/60">?„ì§ ?•ì‚° ?´ì—­???†ìŠµ?ˆë‹¤.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
