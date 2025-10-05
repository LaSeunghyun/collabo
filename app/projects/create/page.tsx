'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ProjectFormData {
  // 기본 정보
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  
  // 목표 설정
  targetAmount: number;
  endDate: string;
  currency: string;
  
  // 리워드
  rewards: Array<{
    title: string;
    description: string;
    price: number;
    stock?: number;
    deliveryType: 'SHIPPING' | 'PICKUP' | 'DIGITAL' | 'TICKET';
    estimatedDelivery?: string;
    isEarlyBird: boolean;
    options?: any;
  }>;
  
  // 예산/정산
  budget: {
    production: number;
    marketing: number;
    performance: number;
    platformFee: number;
    contingency: number;
  };
  
  // 파트너 매칭
  needsPartner: boolean;
  partnerRequirements?: {
    category: string;
    minBudget: number;
    maxBudget: number;
    location?: string;
    services: string[];
    startDate?: string;
    endDate?: string;
  };
  
  // 법적 동의
  agreements: {
    copyright: boolean;
    portrait: boolean;
    refund: boolean;
  };
}

export default function CreateProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: '',
    targetAmount: 0,
    endDate: '',
    currency: 'KRW',
    rewards: [],
    budget: {
      production: 0,
      marketing: 0,
      performance: 0,
      platformFee: 0,
      contingency: 0
    },
    needsPartner: false,
    agreements: {
      copyright: false,
      portrait: false,
      refund: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const project = await response.json();
        router.push(`/projects/${project.id}`);
      } else {
        console.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: '기본 정보', description: '프로젝트 기본 정보를 입력하세요' },
    { id: 2, title: '목표 설정', description: '목표 금액과 일정을 설정하세요' },
    { id: 3, title: '리워드 설계', description: '후원자에게 제공할 리워드를 설계하세요' },
    { id: 4, title: '예산 계획', description: '예산과 정산 계획을 수립하세요' },
    { id: 5, title: '파트너 매칭', description: '필요시 파트너 매칭을 설정하세요' },
    { id: 6, title: '동의 및 제출', description: '약관에 동의하고 프로젝트를 제출하세요' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">프로젝트 생성</h1>
          <p className="text-white/70">아티스트의 꿈을 현실로 만드는 첫 걸음</p>
        </div>

        {/* 진행 단계 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-white/20 text-white/60'
                }`}>
                  {step.id}
                </div>
                {step.id < steps.length && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <h2 className="text-xl font-semibold text-white">{steps[currentStep - 1].title}</h2>
            <p className="text-white/60">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* 폼 컨텐츠 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            {currentStep === 1 && (
              <BasicInfoStep 
                data={formData} 
                onChange={(data) => setFormData({ ...formData, ...data })} 
              />
            )}
            {currentStep === 2 && (
              <GoalSettingStep 
                data={formData} 
                onChange={(data) => setFormData({ ...formData, ...data })} 
              />
            )}
            {currentStep === 3 && (
              <RewardDesignStep 
                data={formData} 
                onChange={(data) => setFormData({ ...formData, ...data })} 
              />
            )}
            {currentStep === 4 && (
              <BudgetPlanningStep 
                data={formData} 
                onChange={(data) => setFormData({ ...formData, ...data })} 
              />
            )}
            {currentStep === 5 && (
              <PartnerMatchingStep 
                data={formData} 
                onChange={(data) => setFormData({ ...formData, ...data })} 
              />
            )}
            {currentStep === 6 && (
              <AgreementStep 
                data={formData} 
                onChange={(data) => setFormData({ ...formData, ...data })} 
              />
            )}

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              
              {currentStep < 6 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
                >
                  다음
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.agreements.copyright || !formData.agreements.portrait || !formData.agreements.refund}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '제출 중...' : '프로젝트 제출'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 각 단계별 컴포넌트들
function BasicInfoStep({ data, onChange }: { data: ProjectFormData; onChange: (data: Partial<ProjectFormData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white font-semibold mb-2">프로젝트 제목</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="프로젝트 제목을 입력하세요"
        />
      </div>
      
      <div>
        <label className="block text-white font-semibold mb-2">카테고리</label>
        <select
          value={data.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">카테고리를 선택하세요</option>
          <option value="music">음악</option>
          <option value="art">미술</option>
          <option value="film">영화</option>
          <option value="theater">연극</option>
          <option value="dance">댄스</option>
          <option value="literature">문학</option>
          <option value="other">기타</option>
        </select>
      </div>
      
      <div>
        <label className="block text-white font-semibold mb-2">프로젝트 설명</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={6}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="프로젝트에 대해 자세히 설명해주세요"
        />
      </div>
    </div>
  );
}

function GoalSettingStep({ data, onChange }: { data: ProjectFormData; onChange: (data: Partial<ProjectFormData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white font-semibold mb-2">목표 금액 (원)</label>
        <input
          type="number"
          value={data.targetAmount}
          onChange={(e) => onChange({ targetAmount: parseInt(e.target.value) || 0 })}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="목표 금액을 입력하세요"
        />
      </div>
      
      <div>
        <label className="block text-white font-semibold mb-2">마감일</label>
        <input
          type="date"
          value={data.endDate}
          onChange={(e) => onChange({ endDate: e.target.value })}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-white/60 text-sm mt-2">권장 기간: 7-45일</p>
      </div>
    </div>
  );
}

function RewardDesignStep({ data, onChange }: { data: ProjectFormData; onChange: (data: Partial<ProjectFormData>) => void }) {
  const addReward = () => {
    onChange({
      rewards: [
        ...data.rewards,
        {
          title: '',
          description: '',
          price: 0,
          deliveryType: 'SHIPPING' as const,
          isEarlyBird: false
        }
      ]
    });
  };

  const updateReward = (index: number, reward: any) => {
    const newRewards = [...data.rewards];
    newRewards[index] = reward;
    onChange({ rewards: newRewards });
  };

  const removeReward = (index: number) => {
    const newRewards = data.rewards.filter((_, i) => i !== index);
    onChange({ rewards: newRewards });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold">리워드 설계</h3>
        <button
          onClick={addReward}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
        >
          리워드 추가
        </button>
      </div>
      
      {data.rewards.map((reward, index) => (
        <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-white font-medium">리워드 {index + 1}</h4>
            <button
              onClick={() => removeReward(index)}
              className="text-red-400 hover:text-red-300"
            >
              삭제
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">제목</label>
              <input
                type="text"
                value={reward.title}
                onChange={(e) => updateReward(index, { ...reward, title: e.target.value })}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="리워드 제목"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">가격 (원)</label>
              <input
                type="number"
                value={reward.price}
                onChange={(e) => updateReward(index, { ...reward, price: parseInt(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="가격"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">배송 방식</label>
              <select
                value={reward.deliveryType}
                onChange={(e) => updateReward(index, { ...reward, deliveryType: e.target.value as any })}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="SHIPPING">택배</option>
                <option value="PICKUP">현장수령</option>
                <option value="DIGITAL">디지털</option>
                <option value="TICKET">티켓</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">수량 제한</label>
              <input
                type="number"
                value={reward.stock || ''}
                onChange={(e) => updateReward(index, { ...reward, stock: parseInt(e.target.value) || undefined })}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="무제한"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-white/80 text-sm mb-1">설명</label>
            <textarea
              value={reward.description}
              onChange={(e) => updateReward(index, { ...reward, description: e.target.value })}
              rows={2}
              className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="리워드 설명"
            />
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id={`earlybird-${index}`}
              checked={reward.isEarlyBird}
              onChange={(e) => updateReward(index, { ...reward, isEarlyBird: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor={`earlybird-${index}`} className="text-white/80 text-sm">
              얼리버드 리워드 (수량 한정)
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetPlanningStep({ data, onChange }: { data: ProjectFormData; onChange: (data: Partial<ProjectFormData>) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-white font-semibold">예산 계획</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/80 text-sm mb-1">제작비</label>
          <input
            type="number"
            value={data.budget.production}
            onChange={(e) => onChange({ 
              budget: { ...data.budget, production: parseInt(e.target.value) || 0 }
            })}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="제작비"
          />
        </div>
        
        <div>
          <label className="block text-white/80 text-sm mb-1">홍보비</label>
          <input
            type="number"
            value={data.budget.marketing}
            onChange={(e) => onChange({ 
              budget: { ...data.budget, marketing: parseInt(e.target.value) || 0 }
            })}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="홍보비"
          />
        </div>
        
        <div>
          <label className="block text-white/80 text-sm mb-1">공연비</label>
          <input
            type="number"
            value={data.budget.performance}
            onChange={(e) => onChange({ 
              budget: { ...data.budget, performance: parseInt(e.target.value) || 0 }
            })}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="공연비"
          />
        </div>
        
        <div>
          <label className="block text-white/80 text-sm mb-1">예비비</label>
          <input
            type="number"
            value={data.budget.contingency}
            onChange={(e) => onChange({ 
              budget: { ...data.budget, contingency: parseInt(e.target.value) || 0 }
            })}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="예비비"
          />
        </div>
      </div>
      
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="text-white font-medium mb-2">예산 요약</h4>
        <div className="text-white/80 text-sm space-y-1">
          <div>제작비: {data.budget.production.toLocaleString()}원</div>
          <div>홍보비: {data.budget.marketing.toLocaleString()}원</div>
          <div>공연비: {data.budget.performance.toLocaleString()}원</div>
          <div>예비비: {data.budget.contingency.toLocaleString()}원</div>
          <div className="border-t border-white/20 pt-2 font-semibold">
            총 예산: {(data.budget.production + data.budget.marketing + data.budget.performance + data.budget.contingency).toLocaleString()}원
          </div>
        </div>
      </div>
    </div>
  );
}

function PartnerMatchingStep({ data, onChange }: { data: ProjectFormData; onChange: (data: Partial<ProjectFormData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="needsPartner"
          checked={data.needsPartner}
          onChange={(e) => onChange({ needsPartner: e.target.checked })}
          className="mr-3"
        />
        <label htmlFor="needsPartner" className="text-white font-semibold">
          파트너 매칭이 필요합니다
        </label>
      </div>
      
      {data.needsPartner && (
        <div className="space-y-4 p-4 bg-white/5 rounded-lg">
          <div>
            <label className="block text-white/80 text-sm mb-1">파트너 카테고리</label>
            <select
              value={data.partnerRequirements?.category || ''}
              onChange={(e) => onChange({
                partnerRequirements: {
                  ...data.partnerRequirements,
                  category: e.target.value,
                  minBudget: data.partnerRequirements?.minBudget || 0,
                  maxBudget: data.partnerRequirements?.maxBudget || 0,
                  services: data.partnerRequirements?.services || []
                }
              })}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">카테고리 선택</option>
              <option value="studio">스튜디오</option>
              <option value="venue">공연장</option>
              <option value="production">제작사</option>
              <option value="merchandise">머천다이즈</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">최소 예산</label>
              <input
                type="number"
                value={data.partnerRequirements?.minBudget || ''}
                onChange={(e) => onChange({
                  partnerRequirements: {
                    ...data.partnerRequirements,
                    minBudget: parseInt(e.target.value) || 0
                  }
                })}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="최소 예산"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">최대 예산</label>
              <input
                type="number"
                value={data.partnerRequirements?.maxBudget || ''}
                onChange={(e) => onChange({
                  partnerRequirements: {
                    ...data.partnerRequirements,
                    maxBudget: parseInt(e.target.value) || 0
                  }
                })}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="최대 예산"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-white/80 text-sm mb-1">지역</label>
            <input
              type="text"
              value={data.partnerRequirements?.location || ''}
              onChange={(e) => onChange({
                partnerRequirements: {
                  ...data.partnerRequirements,
                  location: e.target.value
                }
              })}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="서울, 부산 등"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AgreementStep({ data, onChange }: { data: ProjectFormData; onChange: (data: Partial<ProjectFormData>) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-white font-semibold">약관 동의</h3>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="copyright"
            checked={data.agreements.copyright}
            onChange={(e) => onChange({
              agreements: { ...data.agreements, copyright: e.target.checked }
            })}
            className="mr-3 mt-1"
          />
          <label htmlFor="copyright" className="text-white/80">
            저작권 및 초상권 관련 법적 책임을 확인하고 동의합니다.
          </label>
        </div>
        
        <div className="flex items-start">
          <input
            type="checkbox"
            id="portrait"
            checked={data.agreements.portrait}
            onChange={(e) => onChange({
              agreements: { ...data.agreements, portrait: e.target.checked }
            })}
            className="mr-3 mt-1"
          />
          <label htmlFor="portrait" className="text-white/80">
            초상권 사용에 대한 동의를 받았음을 확인합니다.
          </label>
        </div>
        
        <div className="flex items-start">
          <input
            type="checkbox"
            id="refund"
            checked={data.agreements.refund}
            onChange={(e) => onChange({
              agreements: { ...data.agreements, refund: e.target.checked }
            })}
            className="mr-3 mt-1"
          />
          <label htmlFor="refund" className="text-white/80">
            취소 및 환불 정책을 확인하고 동의합니다.
          </label>
        </div>
      </div>
      
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="text-white font-medium mb-2">프로젝트 요약</h4>
        <div className="text-white/80 text-sm space-y-1">
          <div>제목: {data.title}</div>
          <div>카테고리: {data.category}</div>
          <div>목표 금액: {data.targetAmount.toLocaleString()}원</div>
          <div>마감일: {data.endDate}</div>
          <div>리워드 수: {data.rewards.length}개</div>
          <div>파트너 매칭: {data.needsPartner ? '필요' : '불필요'}</div>
        </div>
      </div>
    </div>
  );
}
