'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const loggedRef = useRef(false);

  useEffect(() => {
    // 중복 로그 방지
    if (loggedRef.current) return;
    loggedRef.current = true;

    // 에러는 서버 로그에만 기록 (프론트엔드 콘솔 로그 제거)
    // 필요시 서버 API로 에러 로그 전송 가능
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-white">
          문제가 발생했습니다
        </h1>
        <p className="mb-6 text-sm text-white/70">
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
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
        {process.env.NODE_ENV === 'production' && error.digest && (
          <div className="mt-4 text-xs text-white/50">
            에러 ID: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
}



