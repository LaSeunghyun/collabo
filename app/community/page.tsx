'use client';

import { useCallback, useState } from 'react';

import { CommunityBoard } from '@/components/ui/sections/community-board';
import type { CommunityPost } from '@/lib/data/community';

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
      <section className="pt-10">
        <CommunityBoard onMetaChange={handleMetaChange} />
      </section>
    </div>
  );
}
