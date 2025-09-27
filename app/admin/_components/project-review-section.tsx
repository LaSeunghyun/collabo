import { PROJECT_STATUS_LABELS } from '@/types/prisma';

import { getProjectsPendingReview } from '@/lib/server/projects';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export async function ProjectReviewSection() {
  const projects = await getProjectsPendingReview();

  return (
    <section
      id="project-review"
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/5"
    >
      <header>
        <p className="text-xs uppercase tracking-wider text-primary/60">프로젝트 검수</p>
        <h2 className="mt-1 text-lg font-semibold text-white">검토 대기 프로젝트</h2>
        <p className="mt-2 text-sm text-white/60">
          업로드된 프로젝트 중 검토 상태(REVIEWING)에 머무르고 있는 항목입니다.
        </p>
      </header>

      {projects.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{project.title}</p>
                <p className="text-xs text-white/50">
                  신청일 {dateFormatter.format(project.createdAt)} · 참여 {project.participants}명
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-300">
                {PROJECT_STATUS_LABELS[project.status]}
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
}
