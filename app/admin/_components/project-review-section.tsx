import { PROJECT_STATUS_LABELS } from '@/types/prisma';

import { getProjectsPendingReview } from '@/lib/server/projects';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export async function ProjectReviewSection() {
  try {
    const projects = await getProjectsPendingReview();

    return (
      <section
        id="project-review"
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
      >
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/60">프로젝트 검수</p>
          <h2 className="mt-1 text-lg font-semibold text-white">승인 대기 중인 프로젝트</h2>
          <p className="mt-2 text-sm text-white/60">
            검토 상태의 제출물을 검토하고 창작자들이 빠르게 진행할 수 있도록 도와주세요.
          </p>
        </header>

        {projects.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {projects.map((project: any) => (
              <li
                key={project.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{project.title}</p>
                  <p className="text-xs text-white/50">
                    제출일 {dateFormatter.format(project.createdAt)} | 참여자 {project.participants}명
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-300">
                  {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
            검토 대기 중인 프로젝트가 없습니다.
          </p>
        )}
      </section>
    );
  } catch (error) {
    // Failed to load projects pending review - removed console.error for production
    return (
      <section
        id="project-review"
        className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-100"
      >
        <h2 className="text-lg font-semibold text-red-100">프로젝트 검수</h2>
        <p className="mt-2">검토 대기열을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
      </section>
    );
  }
}
