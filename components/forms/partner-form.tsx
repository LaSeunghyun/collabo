'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface PartnerFormValues {
  name: string;
  type: string;
  description: string;
  contact: string;
}

export function PartnerForm() {
  const { register, handleSubmit, reset } = useForm<PartnerFormValues>();
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (values: PartnerFormValues) => {
    const res = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });

    if (res.ok) {
      setStatus('submitted');
      reset();
    } else {
      setStatus('error');
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
        >
          <option value="studio">스튜디오</option>
          <option value="venue">공연장</option>
          <option value="production">제작사</option>
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
        <label htmlFor="contact" className="block text-sm font-medium text-white">
          연락처
        </label>
        <input
          id="contact"
          {...register('contact', { required: true })}
          className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-2"
          aria-label="연락처"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        aria-label="파트너 등록 제출"
      >
        파트너 등록
      </button>
      {status === 'submitted' ? (
        <p className="text-sm text-emerald-400">접수가 완료되었습니다. 검수 후 연락드릴게요.</p>
      ) : null}
      {status === 'error' ? (
        <p className="text-sm text-red-400">제출 중 문제가 발생했습니다.</p>
      ) : null}
    </form>
  );
}
