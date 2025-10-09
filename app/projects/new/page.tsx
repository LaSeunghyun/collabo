import { UserRole } from '@/types/shared';

import { requireUser } from '@/lib/auth/guards';
import { ROLE_LABELS } from '@/lib/auth/permissions';

export default async function ProjectCreationPage() {
  const { user } = await requireUser({
    roles: [UserRole.CREATOR, UserRole.ADMIN],
    permissions: ['project:create'],
    redirectTo: '/projects/new'
  });

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold text-white">프로젝트 등록</h1>
        <p className="mt-2 text-sm text-white/60">
          {user.name ? `${user.name}님, ` : ''}
          프로젝트 추천을 위한 설문사항을 기반으로 빠르게 프로젝트를 기획해보세요. 핵심 정보 입력과 매니저가 검토합니다.
        </p>
      </header>
      <section className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/70">
          이 페이지는 프로젝트 생성 프로세스의 시작으로, 추후 단계들과 프로젝트 매칭 알고리즘과 연결됩니다.
        </p>
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary-foreground/80">
          <p className="font-medium text-primary-foreground">현재 권한</p>
          <p className="mt-1 text-primary-foreground/70">
            현재 역할:{' '}
            <span className="font-semibold">
              {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
            </span>
            . 프로젝트 생성, 수정, 삭제보기 등의 권한이 부여되었습니다.
          </p>
        </div>
      </section>
    </div>
  );
}