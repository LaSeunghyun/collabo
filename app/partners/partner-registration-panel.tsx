'use client';

import { useCallback, useState } from 'react';
import { PartnerForm, type PartnerFormData } from '@/components/ui/forms/partner-form';

const SUCCESS_MESSAGE =
  '?ŒíŠ¸???±ë¡ ? ì²­???‘ìˆ˜?˜ì—ˆ?µë‹ˆ?? ?´ì˜?€ ê²€?????¹ì¸ ê²°ê³¼ë¥??Œë¦¼?¼ë¡œ ?ˆë‚´???œë¦´ê²Œìš”.';
const ERROR_FALLBACK_MESSAGE =
  '?ŒíŠ¸???±ë¡ ?”ì²­??ì²˜ë¦¬?˜ì? ëª»í–ˆ?´ìš”. ? ì‹œ ???¤ì‹œ ?œë„?˜ê±°???´ì˜?€??ë¬¸ì˜??ì£¼ì„¸??';

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
        // ?‘ë‹µ ?Œì‹± ?¤íŒ¨ ??ê¸°ë³¸ ë¬¸êµ¬ ? ì?
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
          <p className="font-medium text-emerald-200">ê²€???€ê¸?ì¤‘ì´?ìš”</p>
          <p className="mt-1 text-emerald-100/80">{status.message}</p>
        </div>
      ) : null}

      {status.state === 'error' ? (
        <div
          className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100"
          role="alert"
        >
          <p className="font-medium text-rose-200">?±ë¡ ?”ì²­???¤íŒ¨?ˆì–´??/p>
          <p className="mt-1 text-rose-100/80">{status.message}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
        <p className="font-medium text-white">?´ì˜?€ ê²€???„ë¡œ?¸ìŠ¤ ?ˆë‚´</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>?±ë¡ ?”ì²­ ???ì—…??ê¸°ì? 1~2???´ì— ?ë ˆ?´ì…˜ ?€??ê²€? í•´??</li>
          <li>?¹ì¸?˜ë©´ ?ŒíŠ¸???€?œë³´?œì? ?Œë¦¼ ?¼í„°?ì„œ ë°”ë¡œ ?•ì¸?????ˆì–´??</li>
          <li>ì¶”ê? ?ë£Œê°€ ?„ìš”?˜ë©´ ?´ì˜?€?ì„œ ë³´ì™„ ?”ì²­ ?Œë¦¼??ë³´ë‚´?œë ¤??</li>
        </ul>
      </div>
    </div>
  );
}

