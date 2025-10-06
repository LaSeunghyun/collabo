'use client';

import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

async function updateSettlementStatus({ settlementId, status }: { settlementId: string; status: string }) {
  const response = await fetch(`/api/settlements/${settlementId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update settlement status');
  }

  return response.json();
}

export function useSettlementMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: updateSettlementStatus,
    onSuccess: () => {
      toast({
        title: '상태 변경 완료',
        description: '정산 상태가 성공적으로 변경되었습니다.',
      });
      // Invalidate and refetch the settlements query to show the updated data
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
    },
    onError: (error) => {
      toast({
        title: '상태 변경 실패',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { updateStatus, isUpdating };
}
