'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

const PARTNER_TYPE_OPTIONS = [
  { value: 'STUDIO', label: '스튜디오' },
  { value: 'VENUE', label: '공연장' },
  { value: 'PRODUCTION', label: '제작 스튜디오' },
  { value: 'MERCHANDISE', label: '머천다이즈' },
  { value: 'OTHER', label: '기타' }
];

interface PartnerFormValues {
  name: string;
  type: string;
  description?: string;
  contactInfo: string;
  services?: string;
  pricingModel?: string;
  location?: string;
  portfolioUrl?: string;
}

export function PartnerForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<PartnerFormValues>({
    defaultValues: {
      type: PARTNER_TYPE_OPTIONS[0]?.value ?? 'STUDIO'
    }
  });

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (values: PartnerFormValues) => {
    setStatus('idle');
    setErrorMessage(null);

    const payload = {
      name: values.name,
      type: values.type,
      description: values.description?.trim() ? values.description.trim() : undefined,
      contactInfo: values.contactInfo.trim(),
      location: values.location?.trim() ? values.location.trim() : undefined,
      pricingModel: values.pricingModel?.trim() ? values.pricingModel.trim() : undefined,
      portfolioUrl: values.portfolioUrl?.trim() ? values.portfolioUrl.trim() : undefined,
      services: values.services
        ? Array.from(
            new Set(
              values.services
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            )
          )
        : undefined
    };

    const res = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setStatus('success');
      reset({
        type: payload.type
      });
      return;
    }

    setStatus('error');
    try {
      const body = await res.json();
      setErrorMessage(typeof body?.message === 'string' ? body.message : null);
    } catch {
      setErrorMessage(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white">
          업체명
        </label>
        <input
          id="name"
          {...register('name', { required: true })}
          className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2"
          aria-label="파트너 이름"
          required
        />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-white">
          카테고리
        </label>
        <select
          id="type"
          {...register('type', { required: true })}
          className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2"
          aria-label="파트너 유형"
          required
        >
          {PARTNER_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-white">
          소개
        </label>
        <textarea
          id="description"
          {...register('description')}
          className="mt-2 h-28 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2"
          aria-label="파트너 소개"
        />
      </div>
      <div>
        <label htmlFor="contactInfo" className="block text-sm font-medium text-white">
          연락처
        </label>
        <input
          id="contactInfo"
          {...register('contactInfo', { required: true })}
          className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2"
          aria-label="연락처"
          placeholder="example@studio.com"
          required
        />
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-white">
          활동 지역 (선택)
        </label>
        <input
          id="location"
          {...register('location')}
          className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2"
          aria-label="활동 지역"
          placeholder="서울, 수도권 등"
        />
      </div>
      <div>
        <label htmlFor="services" className="block text-sm font-medium text-white">
          제공 서비스 (콤마로 구분)
        </label>
        <input
          id="services"
          {...register('services')}
          className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2"
          aria-label="제공 서비스"
          placeholder="녹음, 믹싱, 마스터링"
        />
      </div>
      <div>
        <label htmlFor="pricingModel" className="block text-sm font-medium text-white">
          요금 체계 (선택)
        </label>
        <input
          id="pricingModel"
          {...register('pricingModel')}
          className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2"
          aria-label="요금 체계"
          placeholder="시간당, 프로젝트 단위 등"
        />
      </div>
      <div>
        <label htmlFor="portfolioUrl" className="block text-sm font-medium text-white">
          포트폴리오 링크 (선택)
        </label>
        <input
          id="portfolioUrl"
          {...register('portfolioUrl')}
          className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2"
          aria-label="포트폴리오 링크"
          placeholder="https://..."
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="파트너 등록 제출"
        disabled={isSubmitting}
      >
        {isSubmitting ? '제출 중...' : '파트너 등록'}
      </button>
      <div aria-live="polite" className="min-h-[1.5rem] text-sm">
        {status === 'success' ? (
          <p className="text-emerald-400">접수가 완료되었습니다. 검수 후 연락드릴게요.</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-red-400">
            {errorMessage ?? '제출 중 문제가 발생했습니다. 다시 시도해주세요.'}
          </p>
        ) : null}
      </div>
    </form>
  );
}
