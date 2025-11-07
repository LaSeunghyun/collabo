'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

import type { CommunityPost } from '@/lib/data/community';

// 대형 컴포넌트를 동적 import로 코드 스플리팅
const CommunityBoard = dynamic(
  () => import('@/components/ui/sections/community-board').then(mod => ({ default: mod.CommunityBoard })),
  { ssr: true }
);

interface FeedHighlights {
  pinned: CommunityPost[];
  popular: CommunityPost[];
  total: number;
}

export default function CommunityPage() {
  const [, setHighlights] = useState<FeedHighlights>({ pinned: [], popular: [], total: 0 });

  const handleMetaChange = useCallback((meta: FeedHighlights) => {
    setHighlights(meta);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <section className="pt-6">
        <CommunityBoard onMetaChange={handleMetaChange} />
      </section>
    </div>
  );
}
