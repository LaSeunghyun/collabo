'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PartnerType, type PartnerTypeValue } from '@/types/prisma';

export type PartnerFormData = {
  name: string;
  description: string;
  type: PartnerTypeValue;
  contactInfo: string;
  location: string;
  portfolioUrl: string;
};

interface PartnerFormProps {
  onSubmit: (data: PartnerFormData) => Promise<void>;
  initialData?: Partial<PartnerFormData>;
  onSuccess?: () => void;
}

const buildInitialValues = (initialData?: Partial<PartnerFormData>): PartnerFormData => ({
  name: initialData?.name ?? '',
  description: initialData?.description ?? '',
  type: initialData?.type ?? PartnerType.STUDIO,
  contactInfo: initialData?.contactInfo ?? '',
  location: initialData?.location ?? '',
  portfolioUrl: initialData?.portfolioUrl ?? ''
});

const SUBMIT_ERROR_FALLBACK = '파트너 등록 요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';

export function PartnerForm({ onSubmit, initialData, onSuccess }: PartnerFormProps) {
  const initialValues = useMemo(() => buildInitialValues(initialData), [initialData]);
  const [formData, setFormData] = useState<PartnerFormData>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setFormData(buildInitialValues(initialData));
      onSuccess?.();
    } catch (submissionError) {
      if (submissionError instanceof Error && submissionError.message) {
        setError(submissionError.message);
      } else {
        setError(SUBMIT_ERROR_FALLBACK);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof PartnerFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    if (error) {
      setError(null);
    }
  };

  const handleReset = () => {
    setFormData(buildInitialValues(initialData));
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">파트너명 *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(event) => handleChange('name', event.target.value)}
          placeholder="파트너명을 입력하세요"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(event) => handleChange('description', event.target.value)}
          placeholder="제공 서비스와 프로젝트 경험을 소개해 주세요"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">파트너 유형 *</Label>
        <Select value={formData.type} onValueChange={(value) => handleChange('type', value as PartnerTypeValue)}>
          <SelectTrigger>
            <SelectValue placeholder="파트너 유형을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PartnerType.STUDIO}>스튜디오</SelectItem>
            <SelectItem value={PartnerType.VENUE}>공연장</SelectItem>
            <SelectItem value={PartnerType.PRODUCTION}>제작 스튜디오</SelectItem>
            <SelectItem value={PartnerType.MERCHANDISE}>머천다이즈</SelectItem>
            <SelectItem value={PartnerType.OTHER}>기타</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactInfo">연락처 *</Label>
        <Input
          id="contactInfo"
          value={formData.contactInfo}
          onChange={(event) => handleChange('contactInfo', event.target.value)}
          placeholder="연락 가능한 이메일 또는 전화번호"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">위치</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(event) => handleChange('location', event.target.value)}
          placeholder="기반 지역을 입력하세요"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="portfolioUrl">포트폴리오 URL</Label>
        <Input
          id="portfolioUrl"
          type="url"
          value={formData.portfolioUrl}
          onChange={(event) => handleChange('portfolioUrl', event.target.value)}
          placeholder="https://example.com"
        />
      </div>

      {error ? (
        <p className="text-sm text-rose-300" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
          초기화
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '등록 요청 중…' : '파트너 등록 요청'}
        </Button>
      </div>
    </form>
  );
}