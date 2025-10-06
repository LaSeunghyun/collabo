'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ProjectStatus } from '@/types/drizzle';
import Image from 'next/image';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  thumbnail: string | null;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  rewards: Array<{
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock: number | null;
    claimed: number;
    deliveryType: string;
    estimatedDelivery: Date | null;
    isEarlyBird: boolean;
    isStretchGoal: boolean;
  }>;
  fundings: Array<{
    id: string;
    amount: number;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  }>;
  _count: {
    fundings: number;
    rewards: number;
  };
}

interface ProjectDetailViewProps {
  project: Project;
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const { data: session } = useSession();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [showFundingModal, setShowFundingModal] = useState(false);

  const progress = Math.min((project.currentAmount / project.targetAmount) * 100, 100);
  const daysLeft = project.endDate ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isLive = project.status === ProjectStatus.LIVE;
  const isSuccessful = project.status === ProjectStatus.SUCCEEDED;
  const isFailed = project.status === ProjectStatus.FAILED;

  const handleFundProject = async (rewardId: string) => {
    if (!session) {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/auth/signin';
      return;
    }
    
    try {
      // 주문 생성
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          rewardId,
          quantity: 1,
          shippingAddress: {
            name: session.user?.name || 'Unknown',
            address: '서울시 강남구 테헤란로 123',
            phone: '010-1234-5678'
          }
        })
      });

      if (response.ok) {
        const order = await response.json();
        // 주문 상세 페이지로 이동
        window.location.href = `/orders/${order.orderId}`;
      } else {
        const error = await response.json();
        alert(error.message || '주문 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('주문 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* 프로젝트 헤더 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                  {project.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isLive ? 'bg-green-500/20 text-green-400' :
                  isSuccessful ? 'bg-blue-500/20 text-blue-400' :
                  isFailed ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {isLive ? '진행중' : isSuccessful ? '성공' : isFailed ? '실패' : '준비중'}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">{project.title}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {project.owner.avatarUrl ? (
                      <Image 
                        src={project.owner.avatarUrl} 
                        alt={project.owner.name} 
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-primary font-semibold">
                        {project.owner.name[0]}
                      </span>
                    )}
                  </div>
                  <span className="text-white/80">{project.owner.name}</span>
                </div>
              </div>
            </div>
            
            {project.thumbnail && (
              <div className="ml-8">
                <Image 
                  src={project.thumbnail} 
                  alt={project.title}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              </div>
            )}
          </div>

          {/* 진행률 바 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/80">진행률</span>
              <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {project.currentAmount.toLocaleString()}원
              </div>
              <div className="text-white/60 text-sm">모금액</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {project.targetAmount.toLocaleString()}원
              </div>
              <div className="text-white/60 text-sm">목표액</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {project._count.fundings}
              </div>
              <div className="text-white/60 text-sm">후원자</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {daysLeft > 0 ? `${daysLeft}일` : '종료'}
              </div>
              <div className="text-white/60 text-sm">남은 기간</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 프로젝트 설명 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">프로젝트 소개</h2>
              <div className="text-white/80 whitespace-pre-wrap">
                {project.description}
              </div>
            </div>

            {/* 최근 후원자 */}
            {project.fundings.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">최근 후원자</h2>
                <div className="space-y-3">
                  {project.fundings.map((funding) => (
                    <div key={funding.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          {funding.user.avatarUrl ? (
                            <Image 
                              src={funding.user.avatarUrl} 
                              alt={funding.user.name} 
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <span className="text-primary text-sm font-semibold">
                              {funding.user.name[0]}
                            </span>
                          )}
                        </div>
                        <span className="text-white/80">{funding.user.name}</span>
                      </div>
                      <div className="text-white font-semibold">
                        {funding.amount.toLocaleString()}원
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 후원하기 */}
            {isLive && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">후원하기</h3>
                <div className="space-y-3">
                  {project.rewards.map((reward) => (
                    <div key={reward.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium">{reward.title}</h4>
                        <div className="text-primary font-semibold">
                          {reward.price.toLocaleString()}원
                        </div>
                      </div>
                      
                      {reward.description && (
                        <p className="text-white/60 text-sm mb-3">{reward.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-white/60 text-sm">
                          {reward.stock ? `재고: ${reward.stock - reward.claimed}개` : '무제한'}
                        </div>
                        
                        <button
                          onClick={() => handleFundProject(reward.id)}
                          disabled={Boolean(reward.stock && reward.claimed >= reward.stock)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {reward.stock && reward.claimed >= reward.stock ? '품절' : '후원하기'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 프로젝트 정보 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">프로젝트 정보</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">카테고리</span>
                  <span className="text-white">{project.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">시작일</span>
                  <span className="text-white">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : '미정'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">마감일</span>
                  <span className="text-white">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : '미정'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">리워드 수</span>
                  <span className="text-white">{project._count.rewards}개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 후원 모달 */}
      {showFundingModal && selectedReward && (
        <FundingModal
          project={project}
          rewardId={selectedReward}
          onClose={() => {
            setShowFundingModal(false);
            setSelectedReward(null);
          }}
        />
      )}
    </div>
  );
}

// 후원 모달 컴포넌트 (간단한 구현)
function FundingModal({ project, rewardId, onClose }: { 
  project: Project; 
  rewardId: string; 
  onClose: () => void; 
}) {
  const selectedReward = project.rewards.find(r => r.id === rewardId);
  
  if (!selectedReward) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">후원하기</h3>
        
        <div className="mb-4">
          <h4 className="text-white font-medium">{selectedReward.title}</h4>
          <p className="text-white/60 text-sm">{selectedReward.description}</p>
          <p className="text-primary font-semibold mt-2">
            {selectedReward.price.toLocaleString()}원
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => {
              // 실제 결제 로직 구현
              alert('결제 기능은 구현 예정입니다.');
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
          >
            결제하기
          </button>
        </div>
      </div>
    </div>
  );
}
