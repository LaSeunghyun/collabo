'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 글로벌 에러를 로깅 서비스에 전송
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
              심각한 문제가 발생했습니다
            </h1>
            <p className="mb-6 text-sm text-white/70">
              애플리케이션에 심각한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
