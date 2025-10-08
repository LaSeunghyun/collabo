'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ê¸€ë¡œë²Œ ?ëŸ¬ë¥?ë¡œê¹… ?œë¹„?¤ì— ?„ì†¡
    console.error('Global application error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server'
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
          <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="mb-4 text-2xl font-semibold text-white">
              ?¬ê°??ë¬¸ì œê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤
            </h1>
            <p className="mb-6 text-sm text-white/70">
              ? í”Œë¦¬ì??´ì…˜???¬ê°???¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ?˜ì´ì§€ë¥??ˆë¡œê³ ì¹¨?˜ê±°??? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ?˜ì´ì§€ ?ˆë¡œê³ ì¹¨
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
