import Link from 'next/link';

const navigationAnchors = [
  { href: '#overview', label: '?„í™© ?”ì•½' },
  { href: '#profile', label: '?„ë¡œ??ê´€ë¦? },
  { href: '#insights', label: 'ì¶”ì²œ ?„í‹°?¤íŠ¸' }
];

export default async function PartnerDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <div className="pt-6">
        <nav className="mb-8 flex gap-4">
          {navigationAnchors.map((anchor) => (
            <Link
              key={anchor.href}
              href={anchor.href}
              className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              {anchor.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
