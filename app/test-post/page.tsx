'use client';

import { useState } from 'react';

export default function TestPostPage() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL'
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ê²Œì‹œê¸€ ?‘ì„± ?ŒìŠ¤??/h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">?œëª©</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="ê²Œì‹œê¸€ ?œëª©???…ë ¥?˜ì„¸??
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">?´ìš©</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-2 border rounded h-32"
            placeholder="ê²Œì‹œê¸€ ?´ìš©???…ë ¥?˜ì„¸??
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">ì¹´í…Œê³ ë¦¬</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="GENERAL">?¼ë°˜</option>
            <option value="NOTICE">ê³µì?</option>
            <option value="COLLAB">?‘ì—…</option>
            <option value="SUPPORT">ì§€??/option>
            <option value="SHOWCASE">?¼ì??´ìŠ¤</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '?‘ì„± ì¤?..' : 'ê²Œì‹œê¸€ ?‘ì„±'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-bold mb-2">ê²°ê³¼:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
