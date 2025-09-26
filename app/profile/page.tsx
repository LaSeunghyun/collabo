export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">내 정보</h1>
        <p className="mt-2 text-sm text-white/60">로그인 후 팬/크리에이터 권한에 따라 대시보드가 구성됩니다.</p>
      </header>
      <section className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/70">현재는 데모 계정으로 로그인하여 기본 정보를 확인할 수 있습니다.</p>
      </section>
    </div>
  );
}
