'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signIn } from 'next-auth/react';

type FollowButtonProps = {
  artistId: string;
  initialIsFollowing: boolean;
  isAuthenticated: boolean;
  onFollowerChange?: (count: number) => void;
};

export function FollowButton({ artistId, initialIsFollowing, isAuthenticated, onFollowerChange }: FollowButtonProps) {
  const { t } = useTranslation();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      await signIn();
      return;
    }

    try {
      setIsSubmitting(true);
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/artists/${artistId}/follow`, { method });

      if (!response.ok) {
        throw new Error('Failed to toggle follow status');
      }

      const json = (await response.json()) as { followerCount: number; isFollowing: boolean };
      setIsFollowing(json.isFollowing);
      if (onFollowerChange) {
        onFollowerChange(json.followerCount);
      }
    } catch (error) {
      console.error('Failed to toggle follow state', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const label = isFollowing ? t('artist.actions.following') : t('artist.actions.follow');

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isSubmitting}
      aria-pressed={isFollowing}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 ${
        isFollowing
          ? 'border-white/40 bg-white/10 text-white hover:bg-white/20'
          : 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
      }`}
    >
      {isSubmitting ? t('artist.actions.processing') : label}
    </button>
  );
}
