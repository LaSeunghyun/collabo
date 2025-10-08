'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 글로벌 ?�러�?로깅 ?�비?�에 ?�송
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
              ?�각??문제가 발생?�습?�다
            </h1>
            <p className="mb-6 text-sm text-white/70">
              ?�플리�??�션???�각???�류가 발생?�습?�다. ?�이지�??�로고침?�거???�시 ???�시 ?�도?�주?�요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ?�이지 ?�로고침
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
