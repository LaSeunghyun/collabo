import { Suspense } from 'react';

import { ArtistNetworkSection } from '@/components/home/artist-network-section';
import { CommunityPulseSection } from '@/components/home/community-pulse-section';
import { HeroSection } from '@/components/home/hero-section';
import { ProjectSpotlightSection } from '@/components/home/project-spotlight-section';
import { ResourcesSection } from '@/components/home/resources-section';
import { StoreSection } from '@/components/home/store-section';
import { getHomeProjectSummaries } from '@/lib/server/projects';
import { listHomeArtists } from '@/lib/server/artists';
import { getCommunityPostCount, getHomeCommunityPosts } from '@/lib/server/community';
import { getStoreItems } from '@/lib/server/store';
import type { HomeCommunityPost } from '@/lib/data/community';

// 로딩 스켈레톤 컴포넌트들
function ProjectSpotlightSkeleton() {
  return (
    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
      <div className="h-80 bg-white/5 rounded-3xl animate-pulse" />
    </section>
  );
}

function ArtistNetworkSkeleton() {
  return (
    <section>
      <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    </section>
  );
}

function CommunityPulseSkeleton() {
  return (
    <section>
      <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="h-64 bg-white/5 rounded-3xl animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoreSkeleton() {
  return (
    <section>
      <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 bg-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    </section>
  );
}

// 서버에서 초기 데이터를 병렬로 fetch
async function getHomeData() {
  const [projects, artists, communityPosts, communityPostCount, storeItems] = await Promise.all([
    getHomeProjectSummaries({ take: 10, statuses: ['LIVE'] }),
    listHomeArtists(4),
    getHomeCommunityPosts(5),
    getCommunityPostCount(),
    getStoreItems()
  ]);

  return {
    projects,
    artists,
    communityPosts,
    communityPostCount,
    storeItems
  };
}

export default async function HomePage() {
  const { projects, artists, communityPosts, communityPostCount, storeItems } = await getHomeData();
  
  const [featuredPost, ...highlightedPosts] = communityPosts;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-20">
      <HeroSection
        projectsCount={projects.length}
        communityCount={communityPostCount}
        artistsCount={artists.length}
      />

      <Suspense fallback={<ProjectSpotlightSkeleton />}>
        <ProjectSpotlightSection
          projects={projects}
          isLoading={false}
        />
      </Suspense>

      <Suspense fallback={<ArtistNetworkSkeleton />}>
        <ArtistNetworkSection artists={artists} />
      </Suspense>

      <Suspense fallback={<CommunityPulseSkeleton />}>
        <CommunityPulseSection
          featuredPost={featuredPost}
          highlightedPosts={highlightedPosts}
          hasPosts={communityPosts.length > 0}
        />
      </Suspense>

      <ResourcesSection />

      <Suspense fallback={<StoreSkeleton />}>
        <StoreSection items={storeItems} isLoading={false} />
      </Suspense>
    </div>
  );
}
