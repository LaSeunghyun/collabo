'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CommunityCategory } from '@/types/drizzle';

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
      newErrors.title = '?úÎ™©?Ä 5???¥ÏÉÅ 100???¥ÌïòÎ°??ÖÎ†•?¥Ï£º?∏Ïöî.';
    }
    if (!formData.content.trim() || formData.content.length < 10) {
      newErrors.content = '?¥Ïö©?Ä 10???¥ÏÉÅ ?ÖÎ†•?¥Ï£º?∏Ïöî.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert('Î°úÍ∑∏?∏Ïù¥ ?ÑÏöî?©Îãà??');
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
        alert(error.message || 'Í≤åÏãúÍ∏Ä ?ëÏÑ±???§Ìå®?àÏäµ?àÎã§.');
      }
    } catch (error) {
      console.error('Í≤åÏãúÍ∏Ä ?ëÏÑ± ?§Ìå®:', error);
      alert('Í≤åÏãúÍ∏Ä ?ëÏÑ±???§Ìå®?àÏäµ?àÎã§.');
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
