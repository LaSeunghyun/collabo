import Image from 'next/image';

import { ProjectCard } from '@/components/shared/project-card';
import type { ProjectSummary } from '@/lib/api/projects';
import { listProjects, listProjectsByOwner } from '@/lib/services/projects';

export default async function ArtistProfilePage({ params }: { params: { id: string } }) {
  let artistProjects: ProjectSummary[] = [];

  try {
    artistProjects = await listProjectsByOwner(params.id);

    if (artistProjects.length === 0) {
      artistProjects = await listProjects();
    }
  } catch (error) {
    console.error('Failed to load artist projects', error);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 pb-20">
      <header className="pt-6">
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20">
            <Image
              src="https://images.unsplash.com/photo-1521119989659-a83eee488004"
              alt="Artist portrait"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-white">{params.id.toUpperCase()} 아티스트</h1>
            <p className="mt-2 text-sm text-white/60">
              팬들과 공동 제작하는 프로젝트를 통해 새로운 경험을 만드는 콜라보 아티스트입니다.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/60">누적 후원자</p>
          <p className="mt-2 text-2xl font-semibold text-white">12,340</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/60">총 프로젝트</p>
          <p className="mt-2 text-2xl font-semibold text-white">8</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/60">평균 달성률</p>
          <p className="mt-2 text-2xl font-semibold text-white">132%</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">진행한 프로젝트</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {artistProjects.length === 0 ? (
            <p className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              아직 공개된 프로젝트가 없습니다. 새로운 협업이 등록되면 알려드릴게요.
            </p>
          ) : (
            artistProjects.map((project) => <ProjectCard key={project.id} project={project} />)
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">팬 Q&A</h2>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <p className="text-sm font-semibold text-white">Q. 이번 프로젝트에서 가장 기대되는 부분은?</p>
            <p className="mt-1 text-sm text-white/70">팬들과 함께 만드는 메타버스 스테이지입니다.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Q. 협업하고 싶은 파트너는?</p>
            <p className="mt-1 text-sm text-white/70">Immersive XR 경험을 가진 파트너를 찾고 있어요.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
