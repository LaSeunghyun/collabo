import { getProjectStats, getRecentProjects } from '@/lib/server/projects';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  'DRAFT': '초안',
  'PENDING': '검토중',
  'APPROVED': '승인됨',
  'REJECTED': '거부됨',
  'ACTIVE': '진행중',
  'COMPLETED': '완료',
  'CANCELLED': '취소됨'
};

const categoryLabels: Record<string, string> = {
  'MUSIC': '음악',
  'ART': '미술',
  'FILM': '영화',
  'DANCE': '댄스',
  'THEATER': '연극',
  'LITERATURE': '문학',
  'OTHER': '기타'
};

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW'
});

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default async function AdminProjectsPage() {
  try {
    const [stats, projects] = await Promise.all([
      getProjectStats(),
      getRecentProjects()
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">프로젝트 관리</h1>
          <p className="mt-2 text-sm text-white/60">
            프로젝트 현황을 확인하고 승인/거부를 관리하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-white/60">전체 프로젝트</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
            <div className="text-sm text-white/60">검토중</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            <div className="text-sm text-white/60">진행중</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-bold text-blue-400">{stats.completed}</div>
            <div className="text-sm text-white/60">완료</div>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">최근 프로젝트</h2>
          <p className="mt-1 text-sm text-white/60">처리 대기 중인 프로젝트</p>

          {projects.length > 0 ? (
            <div className="mt-6 space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{categoryLabels[project.category]}</span>
                        <span>•</span>
                        <span>{dateFormatter.format(new Date(project.createdAt))}</span>
                        <span>•</span>
                        <span>작성자: {project.authorId}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-white">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-xs text-white/60 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
                        <span>목표금액: {currencyFormatter.format(project.targetAmount)}</span>
                        <span>현재모집: {currencyFormatter.format(project.currentAmount || 0)}</span>
                        <span>진행률: {Math.round(((project.currentAmount || 0) / project.targetAmount) * 100)}%</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                        {statusLabels[project.status]}
                      </span>
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-300 transition hover:bg-green-500/20">
                          승인
                        </button>
                        <button className="rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20">
                          거부
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 text-center text-white/60">
              처리 대기 중인 프로젝트가 없습니다.
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load project data:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">프로젝트 관리</h1>
          <p className="mt-2 text-sm text-white/60">
            프로젝트 현황을 확인하고 승인/거부를 관리하세요
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-center text-white/60">
            프로젝트 데이터를 불러올 수 없습니다.
          </div>
        </div>
      </div>
    );
  }
}