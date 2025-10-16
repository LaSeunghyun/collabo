import { notFound } from 'next/navigation';

import { ArtistProfileShell } from '@/components/artists/artist-profile-shell';
import { getServerAuthSession } from '@/lib/auth/session';
import { getArtistProfile } from '@/lib/server/artists';

export default async function ArtistProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerAuthSession();
  const profile = await getArtistProfile(params.id, session?.user as any ?? null);

  if (!profile) {
    notFound();
  }

  return <ArtistProfileShell profile={profile} viewerId={session?.user?.id ?? null} />;
}
