import Image from 'next/image';
import { notFound } from 'next/navigation';

import { ProjectDetailTabs } from '@/components/sections/project-detail-tabs';
import { getProjectSummaryById } from '@/lib/services/projects';

interface ProjectPageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  try {
    const project = await getProjectSummaryById(params.id);

    if (!project) {
      notFound();
    }

    const projectData = project;

    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 pb-20">
        <header className="pt-6">
          <span className="text-xs uppercase tracking-[0.3em] text-white/60">{projectData.category}</span>
          <h1 className="mt-3 text-3xl font-semibold text-white">{projectData.title}</h1>
        </header>
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-white/10">
              <Image src={projectData.thumbnail} alt={projectData.title} fill className="object-cover" />
            </div>
            <ProjectDetailTabs projectId={projectData.id} />
          </div>
          <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
              <p className="text-sm text-white/60">달성률</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {Math.round((projectData.currentAmount / projectData.targetAmount) * 100)}%
              </p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, Math.round((projectData.currentAmount / projectData.targetAmount) * 100))}%`
                  }}
                />
              </div>
              <p className="mt-3 text-xs text-white/60">
                {projectData.currentAmount.toLocaleString()}₩ / {projectData.targetAmount.toLocaleString()}₩
              </p>
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              후원하기
            </button>
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
  } catch (error) {
    console.error('Failed to load project detail', error);
    notFound();
  }
}
