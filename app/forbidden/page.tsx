import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold text-white">접근 권한이 없습니다</h1>
      <p className="mt-3 text-sm text-white/70">
        요청하신 페이지에 접근할 수 있는 권한이 없습니다. 계정 정보를 확인하거나 관리자에게 권한을 요청해주세요.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          홈으로 돌아가기
        </Link>
        <Link
          href="/help"
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          도움말
        </Link>
      </div>
    </div>
  );
}