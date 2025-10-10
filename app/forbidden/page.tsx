import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold text-white">?‘ê·¼ ê¶Œí•œ???†ìŠµ?ˆë‹¤</h1>
      <p className="mt-3 text-sm text-white/70">
        ?”ì²­?˜ì‹  ?˜ì´ì§€???‘ê·¼?????ˆëŠ” ê¶Œí•œ???†ìŠµ?ˆë‹¤. ê³„ì • ?•ë³´ë¥??•ì¸?˜ê±°??ê´€ë¦¬ì?ê²Œ ê¶Œí•œ???”ì²­?´ì£¼?¸ìš”.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          ?ˆìœ¼ë¡??Œì•„ê°€ê¸?
        </Link>
        <Link
          href="/help"
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          ?„ì?ë§?
        </Link>
      </div>
    </div>
  );
}
