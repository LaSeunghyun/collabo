export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold text-white">?�근 권한???�요?�니??/h1>
      <p className="mt-3 text-sm text-white/70">
        ?�청?�신 ?�이지???�정 ??�� ?�는 권한???�는 ?�용?�만 ?�근?????�습?�다. 계정 ?�보�??�인?�거??관리자?�게 권한???�청?�주?�요.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        ?�으�??�아가�?
      </a>
    </div>
  );
}
