'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

const PARTNER_TYPES = [
  { value: 'STUDIO', label: '?¤íŠœ?”ì˜¤' },
  { value: 'VENUE', label: 'ê³µì—°?? },
  { value: 'PRODUCTION', label: '?œì‘ ?¤íŠœ?”ì˜¤' },
  { value: 'MERCHANDISE', label: 'ë¨¸ì²œ?¤ì´ì¦? },
  { value: 'OTHER', label: 'ê¸°í?' }
] as const;

interface PartnerFormData {
  name: string;
  description: string;
  type: typeof PARTNER_TYPES[number]['value'];
  location: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

interface PartnerFormProps {
  onSubmit: (data: PartnerFormData) => void;
  onSuccess: () => void;
}

function PartnerForm({ onSubmit, onSuccess }: PartnerFormProps) {
  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    description: '',
    type: 'STUDIO',
    location: '',
    contactEmail: '',
    contactPhone: '',
    website: ''
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
      await onSubmit(formData);
      onSuccess();
    } catch {
      setError('?ŒíŠ¸???±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white">
            ?ŒíŠ¸?ˆëª… *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="?ŒíŠ¸?ˆëª…???…ë ¥?˜ì„¸??
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-white">
            ?ŒíŠ¸???€??*
          </label>
          <select
            id="type"
            name="type"
            required
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {PARTNER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-white">
          ?¤ëª… *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="?ŒíŠ¸?ˆì— ?€???¤ëª…???…ë ¥?˜ì„¸??
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-white">
            ?„ì¹˜ *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="?„ì¹˜ë¥??…ë ¥?˜ì„¸??
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-white">
            ?¹ì‚¬?´íŠ¸
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-white">
            ?°ë½ì²??´ë©”??*
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            required
            value={formData.contactEmail}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="?°ë½ì²??´ë©”?¼ì„ ?…ë ¥?˜ì„¸??
          />
        </div>

        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium text-white">
            ?°ë½ì²??„í™”ë²ˆí˜¸
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="?°ë½ì²??„í™”ë²ˆí˜¸ë¥??…ë ¥?˜ì„¸??
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
        >
          ì·¨ì†Œ
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? '?±ë¡ ì¤?..' : '?ŒíŠ¸???±ë¡'}
        </button>
      </div>
    </form>
  );
}

export function PartnerRegistrationPanel() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<{ state: 'idle' | 'success' | 'error'; message?: string }>({ state: 'idle' });

  const handleSubmit = async (data: PartnerFormData) => {
    const response = await fetch('/api/partners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('?ŒíŠ¸???±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }

    return response.json();
  };

  const handleSuccess = () => {
    setStatus({ state: 'success', message: '?ŒíŠ¸???±ë¡???„ë£Œ?˜ì—ˆ?µë‹ˆ?? ê²€?????¹ì¸?©ë‹ˆ??' });
  };

  if (!session) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white/60">?ŒíŠ¸???±ë¡???„í•´?œëŠ” ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PartnerForm onSubmit={handleSubmit} onSuccess={handleSuccess} />

      {status.state === 'success' ? (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-300">
          {status.message}
        </div>
      ) : null}
    </div>
  );
}
