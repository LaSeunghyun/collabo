'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'notice', label: '공지사항' },
  { value: 'general', label: '일반' },
  { value: 'collab', label: '협업' },
  { value: 'support', label: '지원' },
  { value: 'showcase', label: '쇼케이스' }
] as const;

export default function NewCommunityPostPage() {
  const { status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as typeof CATEGORIES[number]['value']
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/community/${data.id}`);
      } else {
        const data = await response.json();
        setError(data.error || '게시글 작성에 실패했습니다.');
      }
    } catch (error: any) {
      setError(error.message || '게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인되지 않은 경우 (이론적으로는 미들웨어에서 리다이렉트되지 않을 수 있음)
  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="pt-10">
          <Link
            href="/community"
            className="text-sm text-blue-300 hover:text-blue-200"
          >
            ← 커뮤니티로 돌아가기
          </Link>
        </div>
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-white">로그인이 필요합니다</h1>
          <p className="mt-2 text-white/60">
            게시글을 작성하려면 로그인해주세요.
          </p>
          <Link
            href="/auth/signin"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  // 로딩 중
  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="pt-10">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary mx-auto" />
            <p className="mt-2 text-white/60">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <div className="pt-10">
        <Link
          href="/community"
          className="text-sm text-blue-300 hover:text-blue-200"
        >
          ← 커뮤니티로 돌아가기
        </Link>
      </div>

      <div className="mt-8">
        <h1 className="text-3xl font-bold text-white">새 게시글 작성</h1>
        <p className="mt-2 text-white/60">
          커뮤니티에 새로운 이야기를 공유해보세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-white">
            제목
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="게시글 제목을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-white">
            카테고리
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-white">
            내용
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={12}
            value={formData.content}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="게시글 내용을 입력하세요"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '작성 중...' : '게시글 작성'}
          </button>
        </div>
      </form>
    </div>
  );
}