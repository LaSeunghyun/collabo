import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  href?: string;
  ctaLabel?: string;
}

export function SectionHeader({ title, href, ctaLabel }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm text-white/60 transition hover:text-white"
        >
          {ctaLabel ?? '더 보기'}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
