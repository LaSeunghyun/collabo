'use client';

import { useEffect, useRef } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const loggedRef = useRef(false);

  useEffect(() => {
    // 중복 로그 방지
    if (loggedRef.current) return;
    loggedRef.current = true;

    // 글로벌 에러는 서버 로그에만 기록 (프론트엔드 콘솔 로그 제거)
    // 필요시 서버 API로 에러 로그 전송 가능
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
