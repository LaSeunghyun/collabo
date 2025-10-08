'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ?ëŸ¬ë¥?ë¡œê¹… ?œë¹„?¤ì— ?„ì†¡
    console.error('Application error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-white">
          ë¬¸ì œê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤
        </h1>
        <p className="mb-6 text-sm text-white/70">
          ?ˆìƒì¹?ëª»í•œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ? ì‹œ ???¤ì‹œ ?œë„?´ì£¼?¸ìš”.
        </p>
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-primary hover:bg-primary/90"
          >
            ?¤ì‹œ ?œë„
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            ?ˆìœ¼ë¡??´ë™
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-white/50">
              ê°œë°œ???•ë³´ (ê°œë°œ ëª¨ë“œ)
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-neutral-900 p-2 text-xs text-white/70">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}



