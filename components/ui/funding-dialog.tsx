import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

interface Project {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  status: string;
  owner: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface FundingDialogProps {
  project: Project;
  children: React.ReactNode;
}

export function FundingDialog({ project, children }: FundingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 실제 펀딩 로직 구현
      const response = await fetch('/api/funding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          amount: parseInt(amount),
        }),
      });

      if (response.status === 401) {
        // 인증이 필요한 경우 로그인 페이지로 리다이렉트
        signIn();
        return;
      }

      if (response.ok) {
        handleClose();
        // 성공 메시지 표시
      } else {
        // 에러 처리
        console.error('펀딩 실패');
      }
    } catch (error) {
      console.error('펀딩 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div onClick={handleOpen}>
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              프로젝트 후원
            </h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-900">{project.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  후원금액 (원)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="후원할 금액을 입력하세요"
                  required
                  min="1000"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? '처리중...' : '후원하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
