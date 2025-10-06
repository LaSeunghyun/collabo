import { UserRole } from '@/types/drizzle';

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
        <h1 className="text-3xl font-semibold text-white">?„ë¡œ?íŠ¸ ?±ë¡</h1>
        <p className="mt-2 text-sm text-white/60">
          {user.name ? `${user.name}?? ` : ''}
          ?ŒíŠ¸??ì¶”ì²œê³????¸ì‚¬?´íŠ¸ë¥?ê¸°ë°˜?¼ë¡œ ë¹ ë¥´ê²??„ë¡œ?íŠ¸ë¥?ê¸°íš??ë³´ì„¸?? ?µì‹¬ ?•ë³´ ?…ë ¥ ??ë§¤ë‹ˆ?€ê°€ ê²€?˜í•©?ˆë‹¤.
        </p>
      </header>
      <section className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/70">
          ???˜ì´ì§€???„ë¡œ?íŠ¸ ?ì„± ?Œë¡œ?°ì˜ ?œì‘?ìœ¼ë¡? ì¶”í›„ ?¤í…ë³??¼ê³¼ ?ŒíŠ¸??ë§¤ì¹­ ?Œê³ ë¦¬ì¦˜???°ê²°?©ë‹ˆ??
        </p>
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary-foreground/80">
          <p className="font-medium text-primary-foreground">?‘ê·¼ ê¶Œí•œ</p>
          <p className="mt-1 text-primary-foreground/70">
            ?„ì¬ ??• :{' '}
            <span className="font-semibold">
              {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
            </span>
            . ?„ë¡œ?íŠ¸ ?ì„±, ?˜ì •, ?€?œë³´???´ëŒ ê¶Œí•œ???œì„±?”ë˜?ˆìŠµ?ˆë‹¤.
          </p>
        </div>
      </section>
    </div>
  );
}
