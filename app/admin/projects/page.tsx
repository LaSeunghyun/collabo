import { getProjectsPendingReview } from '@/lib/server/projects';
import { PROJECT_STATUS_LABELS } from '@/types/prisma';

// 동적 렌더링 강제 - 빌드 시 데이터베이스 접근 방지
export const dynamic = 'force-dynamic';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export default async function AdminProjectsPage() {
  try {
    const projects = await getProjectsPendingReview();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">프로젝트 검수</h1>
          <p className="mt-2 text-sm text-white/60">
            검토 상태의 제출물을 검토하고 창작자들이 빠르게 진행할 수 있도록 도와주세요.
          </p>
        </div>

        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project: any) => (
              <div
                key={project.id}
                className="rounded-2xl border border-white/5 bg-white/[0.05] p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{project.title}</h3>
                    <p className="mt-1 text-sm text-white/60">
                      제출일 {dateFormatter.format(project.createdAt)} | 참여자 {project.participants}명
                    </p>
                    {project.description && (
                      <p className="mt-3 text-sm text-white/70 line-clamp-3">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-300">
                      {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}
                    </span>
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        승인
                      </button>
                      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                        거부
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-8 py-12 text-center">
            <p className="text-sm text-white/60">검토 대기 중인 프로젝트가 없습니다.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('프로젝트 목록 로드 실패:', error);
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100">
        <h2 className="text-lg font-semibold text-red-100">프로젝트 검수</h2>
        <p className="mt-2">검토 대기열을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }
}
