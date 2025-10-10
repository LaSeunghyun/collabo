'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'notice', label: 'ê³µì??¬í•­' },
  { value: 'general', label: '?¼ë°˜' },
  { value: 'collab', label: '?‘ì—…' },
  { value: 'support', label: 'ì§€?? },
  { value: 'showcase', label: '?¼ì??´ìŠ¤' }
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
        setError(data.error || 'ê²Œì‹œê¸€ ?‘ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      }
    } catch (error: any) {
      setError(error.message || 'ê²Œì‹œê¸€ ?‘ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
    } finally {
      setIsLoading(false);
    }
  };

  // ë¡œê·¸?¸ë˜ì§€ ?Šì? ê²½ìš° (?´ë¡ ?ìœ¼ë¡œëŠ” ë¯¸ë“¤?¨ì–´?ì„œ ë¦¬ë‹¤?´ë ‰?¸ë˜ì§€ ?Šì„ ???ˆìŒ)
  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="pt-10">
          <Link
            href="/community"
            className="text-sm text-blue-300 hover:text-blue-200"
          >
            ??ì»¤ë??ˆí‹°ë¡??Œì•„ê°€ê¸?
          </Link>
        </div>
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-white">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??/h1>
          <p className="mt-2 text-white/60">
            ê²Œì‹œê¸€???‘ì„±?˜ë ¤ë©?ë¡œê·¸?¸í•´ì£¼ì„¸??
          </p>
          <Link
            href="/auth/signin"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ë¡œê·¸?¸í•˜ê¸?
          </Link>
        </div>
      </div>
    );
  }

  // ë¡œë”© ì¤?
  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="pt-10">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary mx-auto" />
            <p className="mt-2 text-white/60">ë¡œë”© ì¤?..</p>
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
          ??ì»¤ë??ˆí‹°ë¡??Œì•„ê°€ê¸?
        </Link>
      </div>

      <div className="mt-8">
        <h1 className="text-3xl font-bold text-white">??ê²Œì‹œê¸€ ?‘ì„±</h1>
        <p className="mt-2 text-white/60">
          ì»¤ë??ˆí‹°???ˆë¡œ???´ì•¼ê¸°ë? ê³µìœ ?´ë³´?¸ìš”.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-white">
            ?œëª©
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="ê²Œì‹œê¸€ ?œëª©???…ë ¥?˜ì„¸??
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-white">
            ì¹´í…Œê³ ë¦¬
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
            ?´ìš©
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={12}
            value={formData.content}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="ê²Œì‹œê¸€ ?´ìš©???…ë ¥?˜ì„¸??
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
            ì·¨ì†Œ
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '?‘ì„± ì¤?..' : 'ê²Œì‹œê¸€ ?‘ì„±'}
          </button>
        </div>
      </form>
    </div>
  );
}
