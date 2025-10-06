'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ProjectFormData {
  // ê¸°ë³¸ ?•ë³´
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  
  // ëª©í‘œ ?¤ì •
  targetAmount: number;
  endDate: string;
  currency: string;
  
  // ë¦¬ì›Œ??
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
  
  // ?ˆì‚°/?•ì‚°
  budget: {
    production: number;
    marketing: number;
    performance: number;
    platformFee: number;
    contingency: number;
  };
  
  // ?ŒíŠ¸??ë§¤ì¹­
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
  
  // ë²•ì  ?™ì˜
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
    { id: 1, title: 'ê¸°ë³¸ ?•ë³´', description: '?„ë¡œ?íŠ¸ ê¸°ë³¸ ?•ë³´ë¥??…ë ¥?˜ì„¸?? },
    { id: 2, title: 'ëª©í‘œ ?¤ì •', description: 'ëª©í‘œ ê¸ˆì•¡ê³??¼ì •???¤ì •?˜ì„¸?? },
    { id: 3, title: 'ë¦¬ì›Œ???¤ê³„', description: '?„ì›?ì—ê²??œê³µ??ë¦¬ì›Œ?œë? ?¤ê³„?˜ì„¸?? },
    { id: 4, title: '?ˆì‚° ê³„íš', description: '?ˆì‚°ê³??•ì‚° ê³„íš???˜ë¦½?˜ì„¸?? },
    { id: 5, title: '?ŒíŠ¸??ë§¤ì¹­', description: '?„ìš”???ŒíŠ¸??ë§¤ì¹­???¤ì •?˜ì„¸?? },
    { id: 6, title: '?™ì˜ ë°??œì¶œ', description: '?½ê????™ì˜?˜ê³  ?„ë¡œ?íŠ¸ë¥??œì¶œ?˜ì„¸?? }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* ?¤ë” */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">?„ë¡œ?íŠ¸ ?ì„±</h1>
          <p className="text-white/70">?„í‹°?¤íŠ¸??ê¿ˆì„ ?„ì‹¤ë¡?ë§Œë“œ??ì²?ê±¸ìŒ</p>
        </div>

        {/* ì§„í–‰ ?¨ê³„ */}
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

        {/* ??ì»¨í…ì¸?*/}
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

            {/* ?¤ë¹„ê²Œì´??ë²„íŠ¼ */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ?´ì „
              </button>
              
              {currentStep < 6 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
                >
                  ?¤ìŒ
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.agreements.copyright || !formData.agreements.portrait || !formData.agreements.refund}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '?œì¶œ ì¤?..' : '?„ë¡œ?íŠ¸ ?œì¶œ'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ê°??¨ê³„ë³?ì»´í¬?ŒíŠ¸??
function BasicInfoStep({ data, onChange }: { data: ProjectFormData; onChange: (data: Partial<ProjectFormData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white font-semibold mb-2">?„ë¡œ?íŠ¸ ?œëª©</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="?„ë¡œ?íŠ¸ ?œëª©???…ë ¥?˜ì„¸??
        />
      </div>
      
      <div>
        <label className="block text-white font-semibold mb-2">ì¹´í…Œê³ ë¦¬</label>
        <select
          value={data.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">ì¹´í…Œê³ ë¦¬ë¥?? íƒ?˜ì„¸??/option>
          <option value="music">?Œì•…</option>
          <option value="art">ë¯¸ìˆ </option>
          <option value="film">?í™”</option>
          <option value="theater">?°ê·¹</option>
          <option value="dance">?„ìŠ¤</option>
          <option value="literature">ë¬¸í•™</option>
          <option value="other">ê¸°í?</option>
        </select>
      </div>
      
      <div>
        <label className="block text-white font-semibold mb-2">?„ë¡œ?íŠ¸ ?¤ëª…</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={6}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="?„ë¡œ?íŠ¸???€???ì„¸???¤ëª…?´ì£¼?¸ìš”"
        />
      </div>
    </div>
  );
}

function GoalSettingStep({ data, onChange }: { data: ProjectFormData; onChange: (data: Partial<ProjectFormData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-white font-semibold mb-2">ëª©í‘œ ê¸ˆì•¡ (??</label>
        <input
          type="number"
          value={data.targetAmount}
          onChange={(e) => onChange({ targetAmount: parseInt(e.target.value) || 0 })}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="ëª©í‘œ ê¸ˆì•¡???…ë ¥?˜ì„¸??
        />
      </div>
      
      <div>
        <label className="block text-white font-semibold mb-2">ë§ˆê°??/label>
        <input
          type="date"
          value={data.endDate}
          onChange={(e) => onChange({ endDate: e.target.value })}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-white/60 text-sm mt-2">ê¶Œì¥ ê¸°ê°„: 7-45??/p>
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
        <h3 className="text-white font-semibold">ë¦¬ì›Œ???¤ê³„</h3>
        <button
          onClick={addReward}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
        >
          ë¦¬ì›Œ??ì¶”ê?
        </button>
      </div>
      
      {data.rewards.map((reward, index) => (
        <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-white font-medium">ë¦¬ì›Œ??{index + 1}</h4>
            <button
              onClick={() => removeReward(index)}
              className="text-red-400 hover:text-red-300"
            >
              ?? œ
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">?œëª©</label>
              <input
                type="text"
                value={reward.title}
                onChange={(e) => updateReward(index, { ...reward, title: e.target.value })}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ë¦¬ì›Œ???œëª©"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">ê°€ê²?(??</label>
              <input
                type="number"
                value={reward.price}
                onChange={(e) => updateReward(index, { ...reward, price: parseInt(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ê°€ê²?
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">ë°°ì†¡ ë°©ì‹</label>
              <select
                value={reward.deliveryType}
                onChange={(e) => updateReward(index, { ...reward, deliveryType: e.target.value as any })}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="SHIPPING">?ë°°</option>
                <option value="PICKUP">?„ì¥?˜ë ¹</option>
                <option value="DIGITAL">?”ì???/option>
                <option value="TICKET">?°ì¼“</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">?˜ëŸ‰ ?œí•œ</label>
              <input
                type="number"
                value={reward.stock || ''}
                onChange={(e) => updateReward(index, { ...reward, stock: parseInt(e.target.value) || undefined })}
                className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ë¬´ì œ??
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-white/80 text-sm mb-1">?¤ëª…</label>
            <textarea
              value={reward.description}
              onChange={(e) => updateReward(index, { ...reward, description: e.target.value })}
              rows={2}
              className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="ë¦¬ì›Œ???¤ëª…"
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
              ?¼ë¦¬ë²„ë“œ ë¦¬ì›Œ??(?˜ëŸ‰ ?œì •)
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
      <h3 className="text-white font-semibold">?ˆì‚° ê³„íš</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/80 text-sm mb-1">?œì‘ë¹?/label>
          <input
            type="number"
            value={data.budget.production}
            onChange={(e) => onChange({ 
              budget: { ...data.budget, production: parseInt(e.target.value) || 0 }
            })}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="?œì‘ë¹?
          />
        </div>
        
        <div>
          <label className="block text-white/80 text-sm mb-1">?ë³´ë¹?/label>
          <input
            type="number"
            value={data.budget.marketing}
            onChange={(e) => onChange({ 
              budget: { ...data.budget, marketing: parseInt(e.target.value) || 0 }
            })}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="?ë³´ë¹?
          />
        </div>
        
        <div>
          <label className="block text-white/80 text-sm mb-1">ê³µì—°ë¹?/label>
          <input
            type="number"
            value={data.budget.performance}
            onChange={(e) => onChange({ 
              budget: { ...data.budget, performance: parseInt(e.target.value) || 0 }
            })}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="ê³µì—°ë¹?
          />
        </div>
        
        <div>
          <label className="block text-white/80 text-sm mb-1">?ˆë¹„ë¹?/label>
          <input
            type="number"
            value={data.budget.contingency}
            onChange={(e) => onChange({ 
              budget: { ...data.budget, contingency: parseInt(e.target.value) || 0 }
            })}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="?ˆë¹„ë¹?
          />
        </div>
      </div>
      
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="text-white font-medium mb-2">?ˆì‚° ?”ì•½</h4>
        <div className="text-white/80 text-sm space-y-1">
          <div>?œì‘ë¹? {data.budget.production.toLocaleString()}??/div>
          <div>?ë³´ë¹? {data.budget.marketing.toLocaleString()}??/div>
          <div>ê³µì—°ë¹? {data.budget.performance.toLocaleString()}??/div>
          <div>?ˆë¹„ë¹? {data.budget.contingency.toLocaleString()}??/div>
          <div className="border-t border-white/20 pt-2 font-semibold">
            ì´??ˆì‚°: {(data.budget.production + data.budget.marketing + data.budget.performance + data.budget.contingency).toLocaleString()}??
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
          ?ŒíŠ¸??ë§¤ì¹­???„ìš”?©ë‹ˆ??
        </label>
      </div>
      
      {data.needsPartner && (
        <div className="space-y-4 p-4 bg-white/5 rounded-lg">
          <div>
            <label className="block text-white/80 text-sm mb-1">?ŒíŠ¸??ì¹´í…Œê³ ë¦¬</label>
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
              <option value="">ì¹´í…Œê³ ë¦¬ ? íƒ</option>
              <option value="studio">?¤íŠœ?”ì˜¤</option>
              <option value="venue">ê³µì—°??/option>
              <option value="production">?œì‘??/option>
              <option value="merchandise">ë¨¸ì²œ?¤ì´ì¦?/option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">ìµœì†Œ ?ˆì‚°</label>
              <input
                type="number"
                value={data.partnerRequirements?.minBudget || ''}
                onChange={(e) => onChange({
                  partnerRequirements: {
                    category: data.partnerRequirements?.category || '',
                    minBudget: parseInt(e.target.value) || 0,
                    maxBudget: data.partnerRequirements?.maxBudget || 0,
                    location: data.partnerRequirements?.location,
                    services: data.partnerRequirements?.services || [],
                    startDate: data.partnerRequirements?.startDate,
                    endDate: data.partnerRequirements?.endDate
                  }
                })}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ìµœì†Œ ?ˆì‚°"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">ìµœë? ?ˆì‚°</label>
              <input
                type="number"
                value={data.partnerRequirements?.maxBudget || ''}
                onChange={(e) => onChange({
                  partnerRequirements: {
                    category: data.partnerRequirements?.category || '',
                    minBudget: data.partnerRequirements?.minBudget || 0,
                    maxBudget: parseInt(e.target.value) || 0,
                    location: data.partnerRequirements?.location,
                    services: data.partnerRequirements?.services || [],
                    startDate: data.partnerRequirements?.startDate,
                    endDate: data.partnerRequirements?.endDate
                  }
                })}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ìµœë? ?ˆì‚°"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-white/80 text-sm mb-1">ì§€??/label>
            <input
              type="text"
              value={data.partnerRequirements?.location || ''}
              onChange={(e) => onChange({
                partnerRequirements: {
                  category: data.partnerRequirements?.category || '',
                  minBudget: data.partnerRequirements?.minBudget || 0,
                  maxBudget: data.partnerRequirements?.maxBudget || 0,
                  location: e.target.value,
                  services: data.partnerRequirements?.services || [],
                  startDate: data.partnerRequirements?.startDate,
                  endDate: data.partnerRequirements?.endDate
                }
              })}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="?œìš¸, ë¶€????
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
      <h3 className="text-white font-semibold">?½ê? ?™ì˜</h3>
      
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
            ?€?‘ê¶Œ ë°?ì´ˆìƒê¶?ê´€??ë²•ì  ì±…ì„???•ì¸?˜ê³  ?™ì˜?©ë‹ˆ??
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
            ì´ˆìƒê¶??¬ìš©???€???™ì˜ë¥?ë°›ì•˜?Œì„ ?•ì¸?©ë‹ˆ??
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
            ì·¨ì†Œ ë°??˜ë¶ˆ ?•ì±…???•ì¸?˜ê³  ?™ì˜?©ë‹ˆ??
          </label>
        </div>
      </div>
      
      <div className="p-4 bg-white/5 rounded-lg">
        <h4 className="text-white font-medium mb-2">?„ë¡œ?íŠ¸ ?”ì•½</h4>
        <div className="text-white/80 text-sm space-y-1">
          <div>?œëª©: {data.title}</div>
          <div>ì¹´í…Œê³ ë¦¬: {data.category}</div>
          <div>ëª©í‘œ ê¸ˆì•¡: {data.targetAmount.toLocaleString()}??/div>
          <div>ë§ˆê°?? {data.endDate}</div>
          <div>ë¦¬ì›Œ???? {data.rewards.length}ê°?/div>
          <div>?ŒíŠ¸??ë§¤ì¹­: {data.needsPartner ? '?„ìš”' : 'ë¶ˆí•„??}</div>
        </div>
      </div>
    </div>
  );
}
