'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PartnerType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/cards';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const PARTNER_TYPE_LABELS = {
  [PartnerType.STUDIO]: '스튜디오',
  [PartnerType.VENUE]: '공연장',
  [PartnerType.PRODUCTION]: '제작 스튜디오',
  [PartnerType.MERCHANDISE]: '머천다이즈',
  [PartnerType.OTHER]: '기타'
};

interface FormData {
  type: PartnerType | '';
  name: string;
  description: string;
  services: string[];
  pricingModel: string;
  contactInfo: string;
  location: string;
  portfolioUrl: string;
  terms: boolean;
}

export default function PartnerRegisterPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    type: '',
    name: '',
    description: '',
    services: [],
    pricingModel: '',
    contactInfo: '',
    location: '',
    portfolioUrl: '',
    terms: false
  });

  const [serviceInput, setServiceInput] = useState('');

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    if (serviceInput.trim() && !formData.services.includes(serviceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, serviceInput.trim()]
      }));
      setServiceInput('');
    }
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms) {
      toast({
        title: '약관 동의 필요',
        description: '이용약관에 동의해야 합니다.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: formData.type,
          name: formData.name,
          description: formData.description,
          services: formData.services,
          pricingModel: formData.pricingModel,
          contactInfo: formData.contactInfo,
          location: formData.location,
          portfolioUrl: formData.portfolioUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '파트너 등록에 실패했습니다.');
      }

      toast({
        title: '등록 완료',
        description: '파트너 등록이 완료되었습니다. 검토 후 승인됩니다.',
      });

      router.push('/partners');
    } catch (error) {
      console.error('파트너 등록 실패:', error);
      toast({
        title: '등록 실패',
        description: error instanceof Error ? error.message : '파트너 등록에 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">파트너 등록</h1>
        <p className="text-gray-600">
          전문 파트너로 등록하여 프로젝트에 참여해보세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            파트너 등록에 필요한 기본 정보를 입력해주세요.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 파트너 유형 */}
            <div className="space-y-2">
              <Label htmlFor="type">파트너 유형 *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="파트너 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTNER_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 파트너명 */}
            <div className="space-y-2">
              <Label htmlFor="name">파트너명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="파트너명을 입력하세요"
                required
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="파트너에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>

            {/* 서비스 */}
            <div className="space-y-2">
              <Label>제공 서비스</Label>
              <div className="flex space-x-2">
                <Input
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  placeholder="서비스를 입력하세요"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                />
                <Button type="button" onClick={addService} variant="outline">
                  추가
                </Button>
              </div>
              {formData.services.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.services.map((service, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-sm">{service}</span>
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 가격 모델 */}
            <div className="space-y-2">
              <Label htmlFor="pricingModel">가격 모델</Label>
              <Input
                id="pricingModel"
                value={formData.pricingModel}
                onChange={(e) => handleInputChange('pricingModel', e.target.value)}
                placeholder="예: 시간당, 프로젝트당, 고정가 등"
              />
            </div>

            {/* 연락처 */}
            <div className="space-y-2">
              <Label htmlFor="contactInfo">연락처 *</Label>
              <Input
                id="contactInfo"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                placeholder="이메일 또는 전화번호"
                required
              />
            </div>

            {/* 위치 */}
            <div className="space-y-2">
              <Label htmlFor="location">위치</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="서울시 강남구 등"
              />
            </div>

            {/* 포트폴리오 URL */}
            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">포트폴리오 URL</Label>
              <Input
                id="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>

            {/* 약관 동의 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.terms}
                onCheckedChange={(checked) => handleInputChange('terms', checked)}
              />
              <Label htmlFor="terms" className="text-sm">
                파트너 등록 약관에 동의합니다 *
              </Label>
            </div>

            {/* 제출 버튼 */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.type || !formData.name || !formData.contactInfo || !formData.terms}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                등록하기
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
