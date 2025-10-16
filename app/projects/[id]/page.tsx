import Image from 'next/image';
import { notFound } from 'next/navigation';

import { FundingDialog } from '@/components/ui/dialogs/funding-dialog';
import { ProjectDetailTabs } from '@/components/ui/sections/project-detail-tabs';
import { getServerAuthSession } from '@/lib/auth/session';
import { getProjectSummaryById } from '@/lib/server/projects';
import { UserRole } from '@/types/prisma';

interface ProjectPageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const project = await getProjectSummaryById(params.id);
  if (!project) {
    notFound();
  }

  const session = await getServerAuthSession();
  const viewerId = session?.user?.id ?? null;
  const viewerRole = session?.user?.role ?? null;
  const canManageUpdates =
    (viewerId && viewerId === project.owner.id) || viewerRole === UserRole.ADMIN;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 pb-20">
      <header className="pt-6">
        <span className="text-xs uppercase tracking-[0.3em] text-white/60">{project.category}</span>
        <h1 className="mt-3 text-3xl font-semibold text-white">{project.title}</h1>
      </header>
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-white/10">
            <Image src={project.thumbnail} alt={project.title} fill className="object-cover" />
          </div>
          <ProjectDetailTabs projectId={project.id} canManageUpdates={canManageUpdates} />
        </div>
        <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-sm text-white/60">달성률</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {Math.round((project.currentAmount / project.targetAmount) * 100)}%
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.round((project.currentAmount / project.targetAmount) * 100))}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-white/60">
              {project.currentAmount.toLocaleString()}₩ / {project.targetAmount.toLocaleString()}₩
            </p>
          </div>
          <FundingDialog
            projectId={project.id}
            projectTitle={project.title}
            defaultAmount={Math.min(50000, Math.max(10000, project.targetAmount / 100))}
          />
          <div className="rounded-2xl border border-white/10 bg-neutral-950/60 p-4">
            <p className="text-xs text-white/60">추천 파트너</p>
            <ul className="mt-2 space-y-3 text-sm text-white/70">
              <li>Studio Aurora – XR Stage</li>
              <li>Wonder Hall – 800석 공연장</li>
              <li>Galaxy Production – MD 제작</li>
            </ul>
            <button type="button" className="mt-4 w-full rounded-xl border border-primary/40 px-4 py-2 text-xs text-primary">
              견적 요청
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
