'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CommunityCategory } from '@/types/prisma';

export interface PostFormData {
  title: string;
  content: string;
  category: CommunityCategory;
  isAnonymous: boolean;
  tags: string[];
}

interface UsePostFormProps {
  projectId?: string;
  initialData?: Partial<PostFormData>;
  onSuccess?: (postId: string) => void;
}

export function usePostForm({ projectId, initialData, onSuccess }: UsePostFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    category: CommunityCategory.GENERAL,
    isAnonymous: false,
    tags: [],
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim() || formData.title.length < 5 || formData.title.length > 100) {
      newErrors.title = '제목은 5자 이상 100자 이하로 입력해주세요.';
    }
    if (!formData.content.trim() || formData.content.length < 10) {
      newErrors.content = '내용은 10자 이상 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, projectId }),
      });

      if (response.ok) {
        const post = await response.json();
        onSuccess?.(post.id);
        router.push(`/community/${post.id}`);
      } else {
        const error = await response.json();
        alert(error.message || '게시글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PostFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToRemove) }));
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleSubmit,
    handleInputChange,
    handleTagAdd,
    handleTagRemove,
  };
}
