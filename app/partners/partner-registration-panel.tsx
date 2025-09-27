'use client';

import { useCallback, useState } from 'react';
import { PartnerForm, type PartnerFormData } from '@/components/ui/forms/partner-form';

const SUCCESS_MESSAGE =
  '파트너 등록 신청이 접수되었습니다. 운영팀 검수 후 승인 결과를 알림으로 안내해 드릴게요.';
const ERROR_FALLBACK_MESSAGE =
  '파트너 등록 요청을 처리하지 못했어요. 잠시 후 다시 시도하거나 운영팀에 문의해 주세요.';

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
      } catch (error) {
        // 응답 파싱 실패 시 기본 문구 유지
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
          <p className="font-medium text-emerald-200">검수 대기 중이에요</p>
          <p className="mt-1 text-emerald-100/80">{status.message}</p>
        </div>
      ) : null}

      {status.state === 'error' ? (
        <div
          className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100"
          role="alert"
        >
          <p className="font-medium text-rose-200">등록 요청이 실패했어요</p>
          <p className="mt-1 text-rose-100/80">{status.message}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
        <p className="font-medium text-white">운영팀 검수 프로세스 안내</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>등록 요청 후 영업일 기준 1~2일 내에 큐레이션 팀이 검토해요.</li>
          <li>승인되면 파트너 대시보드와 알림 센터에서 바로 확인할 수 있어요.</li>
          <li>추가 자료가 필요하면 운영팀에서 보완 요청 알림을 보내드려요.</li>
        </ul>
      </div>
    </div>
  );
}

