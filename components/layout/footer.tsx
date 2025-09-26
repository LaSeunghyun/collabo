import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950/80 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 text-sm text-white/70 md:grid-cols-4">
        <div>
          <h3 className="text-base font-semibold text-white">Collaborium</h3>
          <p className="mt-3 text-white/60">
            아티스트와 팬이 함께 성장하는 팬메이드 펀딩 플랫폼.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">Platform</h4>
          <ul className="space-y-1">
            <li>
              <Link href="/projects" className="hover:text-white">
                프로젝트
              </Link>
            </li>
            <li>
              <Link href="/partners" className="hover:text-white">
                파트너
              </Link>
            </li>
            <li>
              <Link href="/community" className="hover:text-white">
                커뮤니티
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">Support</h4>
          <ul className="space-y-1">
            <li>
              <Link href="/help" className="hover:text-white">
                도움말 센터
              </Link>
            </li>
            <li>
              <Link href="/partners" className="hover:text-white">
                파트너 가입
              </Link>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">Contact</h4>
          <p>contact@collaborium.kr</p>
          <p>서울시 성동구 성수이로 00</p>
        </div>
      </div>
      <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Collaborium. All rights reserved.
      </div>
    </footer>
  );
}
