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
      setError('ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??');
      setIsLoading(false);
      return;
    }

    const fundingAmount = parseFloat(amount);
    if (isNaN(fundingAmount) || fundingAmount <= 0) {
      setError('?¬ë°”ë¥?ê¸ˆì•¡???…ë ¥?´ì£¼?¸ìš”.');
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
        // ?±ê³µ ë©”ì‹œì§€ ?œì‹œ ?ëŠ” ?˜ì´ì§€ ?ˆë¡œê³ ì¹¨
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || '?€?©ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      }
    } catch (error: any) {
      setError(error.message || '?€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
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
                <h2 className="text-lg font-semibold">?„ë¡œ?íŠ¸ ?€??/h2>
                <p className="text-sm text-gray-600">
                  {projectTitle} ?„ë¡œ?íŠ¸???€?©í•˜?¸ìš”
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>?„ì¬ ëª¨ì§‘ê¸ˆì•¡</span>
                  <span>{currentAmount.toLocaleString()}??/span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>ëª©í‘œê¸ˆì•¡</span>
                  <span>{targetAmount.toLocaleString()}??/span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>?¨ì? ê¸ˆì•¡</span>
                  <span>{remainingAmount.toLocaleString()}??/span>
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
                    ?€??ê¸ˆì•¡ (??
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="?€?©í•  ê¸ˆì•¡???…ë ¥?˜ì„¸??
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
                    ì·¨ì†Œ
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? '?€??ì¤?..' : '?€?©í•˜ê¸?}
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
