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
    // 에러 로깅 서비스에 전송
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
          문제가 발생했습니다
        </h1>
        <p className="mb-6 text-sm text-white/70">
          예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.
        </p>
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-primary hover:bg-primary/90"
          >
            다시 시도
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            홈으로 이동
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-white/50">
              개발자 정보 (개발 모드)
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