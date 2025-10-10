import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold text-white">?�근 권한???�습?�다</h1>
      <p className="mt-3 text-sm text-white/70">
        ?�청?�신 ?�이지???�근?????�는 권한???�습?�다. 계정 ?�보�??�인?�거??관리자?�게 권한???�청?�주?�요.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          ?�으�??�아가�?
        </Link>
        <Link
          href="/help"
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          ?��?�?
        </Link>
      </div>
    </div>
  );
}
