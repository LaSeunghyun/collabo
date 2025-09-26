export default function ProjectCreationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">프로젝트 등록</h1>
        <p className="mt-2 text-sm text-white/60">
          파트너 추천과 팬 인사이트를 기반으로 빠르게 프로젝트를 기획해 보세요. 핵심 정보 입력 후 매니저가 검수합니다.
        </p>
      </header>
      <section className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/70">
          이 페이지는 프로젝트 생성 플로우의 시작점으로, 추후 스텝별 폼과 파트너 매칭 알고리즘이 연결됩니다.
        </p>
      </section>
    </div>
  );
}
