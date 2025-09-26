import { CommunityBoard } from '@/components/sections/community-board';

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">커뮤니티</h1>
        <p className="mt-2 text-sm text-white/60">
          프로젝트 후원자들과 실시간으로 소통하고, 아이디어와 피드백을 공유하세요.
        </p>
      </header>
      <section className="mt-10">
        <CommunityBoard />
      </section>
    </div>
  );
}
