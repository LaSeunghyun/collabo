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
        <h1 className="text-3xl font-semibold text-white">?�로?�트 ?�록</h1>
        <p className="mt-2 text-sm text-white/60">
          {user.name ? `${user.name}?? ` : ''}
          ?�로?�트 추천???�한 ?�문?�항??기반?�로 빠르�??�로?�트�?기획?�보?�요. ?�심 ?�보 ?�력�?매니?�가 검?�합?�다.
        </p>
      </header>
      <section className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/70">
          ???�이지???�로?�트 ?�성 ?�로?�스???�작?�로, 추후 ?�계?�과 ?�로?�트 매칭 ?�고리즘�??�결?�니??
        </p>
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary-foreground/80">
          <p className="font-medium text-primary-foreground">?�재 권한</p>
          <p className="mt-1 text-primary-foreground/70">
            ?�재 ??��:{' '}
            <span className="font-semibold">
              {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
            </span>
            . ?�로?�트 ?�성, ?�정, ??��보기 ?�의 권한??부?�되?�습?�다.
          </p>
        </div>
      </section>
    </div>
  );
}
