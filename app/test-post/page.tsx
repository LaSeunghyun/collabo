'use client';

import { useState } from 'react';

export default function TestPostPage() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ error: 'ê²Œì‹œê¸€ ?‘ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ê²Œì‹œê¸€ ?ì„± ?ŒìŠ¤??/h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
            ?œëª©
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ê²Œì‹œê¸€ ?œëª©???…ë ¥?˜ì„¸??
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
            ì¹´í…Œê³ ë¦¬
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">?¼ë°˜</option>
            <option value="notice">ê³µì??¬í•­</option>
            <option value="collab">?‘ì—…</option>
            <option value="support">ì§€??/option>
            <option value="showcase">?¼ì??´ìŠ¤</option>
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-white mb-2">
            ?´ìš©
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={6}
            value={formData.content}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ê²Œì‹œê¸€ ?´ìš©???…ë ¥?˜ì„¸??
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '?‘ì„± ì¤?..' : 'ê²Œì‹œê¸€ ?‘ì„±'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h3 className="text-lg font-semibold mb-2">ê²°ê³¼:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
