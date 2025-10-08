'use client';

import { useCallback, useState } from 'react';
import { PartnerForm, type PartnerFormData } from '@/components/ui/forms/partner-form';

const SUCCESS_MESSAGE =
  '?�트???�록 ?�청???�수?�었?�니?? ?�영?� 검?????�인 결과�??�림?�로 ?�내???�릴게요.';
const ERROR_FALLBACK_MESSAGE =
  '?�트???�록 ?�청??처리?��? 못했?�요. ?�시 ???�시 ?�도?�거???�영?�??문의??주세??';

type SubmissionStatus =
  | { state: 'idle' }
  | { state: 'success'; message: string }
  | { state: 'error'; message: string };

export function PartnerRegistrationPanel() {
  const [status, setStatus] = useState<SubmissionStatus>({ state: 'idle' });

  const handleSubmit = useCallback(async (data: PartnerFormData) => {
    setStatus({ state: 'idle' });

    const response = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      let message = ERROR_FALLBACK_MESSAGE;

      try {
        const payload = await response.json();
        if (payload?.message) {
          message = payload.message;
        }
      } catch {
        // ?�답 ?�싱 ?�패 ??기본 문구 ?��?
      }

      setStatus({ state: 'error', message });
      throw new Error(message);
    }
  }, []);

  const handleSuccess = useCallback(() => {
    setStatus({ state: 'success', message: SUCCESS_MESSAGE });
  }, []);

  return (
    <div className="space-y-4">
      <PartnerForm onSubmit={handleSubmit} onSuccess={handleSuccess} />

      {status.state === 'success' ? (
        <div
          className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100"
          role="status"
          aria-live="polite"
        >
          <p className="font-medium text-emerald-200">검???��?중이?�요</p>
          <p className="mt-1 text-emerald-100/80">{status.message}</p>
        </div>
      ) : null}

      {status.state === 'error' ? (
        <div
          className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100"
          role="alert"
        >
          <p className="font-medium text-rose-200">?�록 ?�청???�패?�어??/p>
          <p className="mt-1 text-rose-100/80">{status.message}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
        <p className="font-medium text-white">?�영?� 검???�로?�스 ?�내</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>?�록 ?�청 ???�업??기�? 1~2???�에 ?�레?�션 ?�??검?�해??</li>
          <li>?�인?�면 ?�트???�?�보?��? ?�림 ?�터?�서 바로 ?�인?????�어??</li>
          <li>추�? ?�료가 ?�요?�면 ?�영?�?�서 보완 ?�청 ?�림??보내?�려??</li>
        </ul>
      </div>
    </div>
  );
}

