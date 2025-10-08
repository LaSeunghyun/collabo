'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface FundingDialogProps {
  projectId: string;
  projectTitle: string;
  targetAmount: number;
  currentAmount: number;
  children: React.ReactNode;
}

export function FundingDialog({ 
  projectId, 
  projectTitle, 
  targetAmount, 
  currentAmount, 
  children 
}: FundingDialogProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!session) {
      setError('로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    const fundingAmount = parseFloat(amount);
    if (isNaN(fundingAmount) || fundingAmount <= 0) {
      setError('올바른 금액을 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/funding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          amount: fundingAmount,
          currency: 'KRW'
        }),
      });

      if (response.ok) {
        setOpen(false);
        setAmount('');
        // 성공 메시지 표시 또는 페이지 새로고침
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || '펀딩에 실패했습니다.');
      }
    } catch (error) {
      setError('펀딩 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const remainingAmount = targetAmount - currentAmount;
  const progressPercentage = (currentAmount / targetAmount) * 100;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center"
      >
        {children}
      </button>
      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">프로젝트 펀딩</h2>
                <p className="text-sm text-gray-600">
                  {projectTitle} 프로젝트에 펀딩하세요
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>현재 모집금액</span>
                  <span>{currentAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>목표금액</span>
                  <span>{targetAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>남은 금액</span>
                  <span>{remainingAmount.toLocaleString()}원</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    펀딩 금액 (원)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="펀딩할 금액을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1000"
                    step="1000"
                    required
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? '펀딩 중...' : '펀딩하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}