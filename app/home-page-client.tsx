'use client';

import { useQuery } from '@tanstack/react-query';

import { ArtistNetworkSection } from '@/components/home/artist-network-section';
import { CommunityPulseSection } from '@/components/home/community-pulse-section';
import { HeroSection } from '@/components/home/hero-section';
import { ProjectSpotlightSection } from '@/components/home/project-spotlight-section';
import { ResourcesSection } from '@/components/home/resources-section';
import { StoreSection } from '@/components/home/store-section';
import { fetchProjects } from '@/lib/api/projects';
import { fetchStoreItems } from '@/lib/api/store';
import type { CommunityFeedResponse } from '@/lib/data/community';
import type { HomeArtistSummary } from '@/types/home';

interface ArtistListResponse {
  artists: HomeArtistSummary[];
}

export function HomePageClient() {
  const { data: storeItems, isLoading: storeLoading } = useQuery({
    queryKey: ['store-items'],
    queryFn: fetchStoreItems,
    staleTime: 1000 * 60 * 5
  });

  const { data: projects, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 1000 * 60
  });

  const { data: artistsResponse } = useQuery<ArtistListResponse>({
    queryKey: ['artists', 'home'],
    queryFn: async () => {
      const res = await fetch('/api/artists?limit=4');
      if (!res.ok) {
        throw new Error('Failed to load artists');
      }
      return (await res.json()) as ArtistListResponse;
    },
    staleTime: 60_000
  });

  const { data: communityResponse } = useQuery<CommunityFeedResponse>({
    queryKey: ['community', 'home'],
    queryFn: async () => {
      const res = await fetch('/api/community?sort=trending&limit=5');
      if (!res.ok) {
        throw new Error('Failed to load community');
      }
      return (await res.json()) as CommunityFeedResponse;
    },
    staleTime: 15_000
  });

  // 안전한 데이터 처리
  const safeStoreItems = Array.isArray(storeItems) ? storeItems : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeArtists = Array.isArray(artistsResponse?.artists) ? artistsResponse.artists : [];
  const safeCommunityPosts = Array.isArray(communityResponse?.posts) ? communityResponse.posts : [];
  
  const [featuredPost, ...highlightedPosts] = safeCommunityPosts;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-20">
      <HeroSection
        projectsCount={safeProjects.length}
        communityCount={safeCommunityPosts.length}
        artistsCount={safeArtists.length}
      />

      <ProjectSpotlightSection
        projects={safeProjects}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />

      <ArtistNetworkSection artists={safeArtists} />

      <CommunityPulseSection
        featuredPost={featuredPost}
        highlightedPosts={highlightedPosts}
        hasPosts={safeCommunityPosts.length > 0}
      />

      <ResourcesSection />

      <StoreSection items={safeStoreItems} isLoading={storeLoading} />
    </div>
  );
}
