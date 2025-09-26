export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold text-white">접근 권한이 필요합니다</h1>
      <p className="mt-3 text-sm text-white/70">
        요청하신 페이지는 특정 역할 또는 권한이 있는 사용자만 접근할 수 있습니다. 계정 정보를 확인하거나 관리자에게 권한을 요청해주세요.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        홈으로 돌아가기
      </a>
    </div>
  );
}
