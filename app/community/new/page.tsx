'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ThreadsComposer } from '@/components/ui/community/ThreadsComposer';
import type { AttachmentMetadata, LinkPreviewMetadata } from '@/lib/data/community';

export default function NewCommunityPostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    content: string;
    images: string[];
    attachments: AttachmentMetadata[];
    linkPreviews: LinkPreviewMetadata[];
    category: string;
  }) => {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '', // Threads 스타일에서는 제목 없음
          content: data.content,
          category: data.category.toUpperCase(),
          images: data.images,
          attachments: data.attachments,
          linkPreviews: data.linkPreviews
        })
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/community/${result.id}`);
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    router.push('/community');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/community/new');
    return null;
  }

  return (
    <ThreadsComposer
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}