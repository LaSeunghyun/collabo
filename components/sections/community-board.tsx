'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { demoCommunityPosts } from '@/lib/data/community';

export function CommunityBoard({ projectId }: { projectId?: string }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const { data: posts = [] } = useQuery({
    queryKey: ['community', projectId],
    queryFn: async () => {
      const res = await fetch('/api/community');
      if (!res.ok) {
        return demoCommunityPosts;
      }
      const json = await res.json();
      return projectId ? json.filter((item: any) => item.projectId === projectId) : json;
    }
  });

  const sorted = [...posts].sort((a, b) => {
    if (sort === 'popular') {
      return b.likes - a.likes;
    }
    return new Date(b.createdAt ?? Date.now()).valueOf() - new Date(a.createdAt ?? Date.now()).valueOf();
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm ${sort === 'recent' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-white/70'}`}
          onClick={() => setSort('recent')}
        >
          {t('community.sortRecent')}
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm ${sort === 'popular' ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-white/70'}`}
          onClick={() => setSort('popular')}
        >
          {t('community.sortPopular')}
        </button>
      </div>
      <div className="space-y-4">
        {sorted.map((post) => (
          <article key={post.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <header className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{post.title}</h3>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {post.likes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments}
                </span>
              </div>
            </header>
            <p className="mt-3 text-sm text-white/70">{post.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
