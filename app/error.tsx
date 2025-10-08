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
    // ?�러�?로깅 ?�비?�에 ?�송
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
          문제가 발생?�습?�다
        </h1>
        <p className="mb-6 text-sm text-white/70">
          ?�상�?못한 ?�류가 발생?�습?�다. ?�시 ???�시 ?�도?�주?�요.
        </p>
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-primary hover:bg-primary/90"
          >
            ?�시 ?�도
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            ?�으�??�동
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-white/50">
              개발???�보 (개발 모드)
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



