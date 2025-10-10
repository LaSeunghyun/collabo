import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

interface ArtistFollowButtonProps {
  artistId: string;
  initialFollowing: boolean;
  followerCount: number;
  onFollowChange: (newCount: number) => void;
}

export function ArtistFollowButton({ 
  artistId, 
  initialFollowing, 
  followerCount, 
  onFollowChange 
}: ArtistFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/artists/${artistId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        signIn();
        return;
      }

      if (response.ok) {
        const newFollowing = !isFollowing;
        setIsFollowing(newFollowing);
        onFollowChange(followerCount + (newFollowing ? 1 : -1));
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      aria-pressed={isFollowing}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        isFollowing
          ? 'bg-white text-black hover:bg-white/90'
          : 'bg-white/10 text-white hover:bg-white/20'
      } disabled:opacity-50`}
    >
      {isLoading ? '처리중...' : isFollowing ? '팔로잉' : '팔로우'}
    </button>
  );
}
