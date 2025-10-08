'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

const PARTNER_TYPES = [
  { value: 'STUDIO', label: '스튜디오' },
  { value: 'VENUE', label: '공연장' },
  { value: 'PRODUCTION', label: '제작 스튜디오' },
  { value: 'MERCHANDISE', label: '머천다이즈' },
  { value: 'OTHER', label: '기타' }
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
      setError('파트너 등록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white">
            파트너명 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="파트너명을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-white">
            파트너 타입 *
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
          설명 *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="파트너에 대한 설명을 입력하세요"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-white">
            위치 *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="위치를 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-white">
            웹사이트
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
            연락처 이메일 *
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            required
            value={formData.contactEmail}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="연락처 이메일을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium text-white">
            연락처 전화번호
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="연락처 전화번호를 입력하세요"
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
          취소
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? '등록 중...' : '파트너 등록'}
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
      throw new Error('파트너 등록에 실패했습니다.');
    }

    return response.json();
  };

  const handleSuccess = () => {
    setStatus({ state: 'success', message: '파트너 등록이 완료되었습니다. 검토 후 승인됩니다.' });
  };

  if (!session) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white/60">파트너 등록을 위해서는 로그인이 필요합니다.</p>
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