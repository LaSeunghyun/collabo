export interface StakeholderShareInput {
  stakeholderId: string;
  share: number;
}

export interface AllocationResult {
  stakeholderId: string;
  amount: number;
  percentage: number;
}

export interface SettlementBreakdown {
  totalRaised: number;
  platformFee: number;
  gatewayFees: number;
  netAmount: number;
  creatorShare: number;
  partnerShareTotal: number;
  collaboratorShareTotal: number;
  partners: AllocationResult[];
  collaborators: AllocationResult[];
}

export interface CalculateSettlementParams {
  totalRaised: number;
  platformFeeRate: number;
  gatewayFees?: number;
  partnerShares?: StakeholderShareInput[];
  collaboratorShares?: StakeholderShareInput[];
}

function sanitiseShares(shares: StakeholderShareInput[] | undefined) {
  if (!shares || shares.length === 0) {
    return [] as StakeholderShareInput[];
  }

  return shares
    .filter((share) => share.share > 0)
    .map((share) => ({
      stakeholderId: share.stakeholderId,
      share: Number(share.share)
    }));
}

function allocatePool(pool: number, shares: StakeholderShareInput[]): AllocationResult[] {
  if (pool <= 0 || shares.length === 0) {
    return shares.map((share) => ({
      stakeholderId: share.stakeholderId,
      amount: 0,
      percentage: share.share
    }));
  }

  const totalShare = shares.reduce((acc, share) => acc + share.share, 0);
  if (totalShare > 1 + Number.EPSILON) {
    throw new Error('배분 비율의 총합이 100%를 초과합니다.');
  }

  const provisional = shares.map((share) => {
    const rawAmount = pool * share.share;
    const baseAmount = Math.floor(rawAmount);
    return {
      stakeholderId: share.stakeholderId,
      baseAmount,
      fraction: rawAmount - baseAmount,
      percentage: share.share
    };
  });

  let remainder = pool - provisional.reduce((acc, item) => acc + item.baseAmount, 0);
  const sortedByFraction = [...provisional].sort((a, b) => b.fraction - a.fraction);

  for (const item of sortedByFraction) {
    if (remainder <= 0) {
      break;
    }

    item.baseAmount += 1;
    remainder -= 1;
  }

  const allocationById = new Map<string, number>();
  for (const item of provisional) {
    allocationById.set(item.stakeholderId, item.baseAmount);
  }

  return shares.map((share) => ({
    stakeholderId: share.stakeholderId,
    amount: allocationById.get(share.stakeholderId) ?? 0,
    percentage: share.share
  }));
}

export function calculateSettlementBreakdown({
  totalRaised,
  platformFeeRate,
  gatewayFees = 0,
  partnerShares,
  collaboratorShares
}: CalculateSettlementParams): SettlementBreakdown {
  if (!Number.isFinite(totalRaised) || totalRaised <= 0) {
    throw new Error('정산을 계산하려면 유효한 모집 금액이 필요합니다.');
  }

  if (platformFeeRate < 0 || platformFeeRate > 1) {
    throw new Error('플랫폼 수수료 비율은 0과 1 사이여야 합니다.');
  }

  if (gatewayFees < 0) {
    throw new Error('결제 수수료는 음수가 될 수 없습니다.');
  }

  const platformFee = Math.round(totalRaised * platformFeeRate);
  const netAmount = Math.max(0, totalRaised - platformFee - Math.round(gatewayFees));

  const partnerShareInputs = sanitiseShares(partnerShares);
  const collaboratorShareInputs = sanitiseShares(collaboratorShares);

  const combinedShare =
    partnerShareInputs.reduce((acc, share) => acc + share.share, 0) +
    collaboratorShareInputs.reduce((acc, share) => acc + share.share, 0);

  if (combinedShare > 1 + Number.EPSILON) {
    throw new Error('파트너와 협력자의 배분 비율의 합이 100%를 초과합니다.');
  }

  const partnerAllocations = allocatePool(netAmount, partnerShareInputs);
  const collaboratorAllocations = allocatePool(netAmount, collaboratorShareInputs);

  const partnerShareTotal = partnerAllocations.reduce((acc, item) => acc + item.amount, 0);
  const collaboratorShareTotal = collaboratorAllocations.reduce((acc, item) => acc + item.amount, 0);

  const creatorShare = Math.max(0, netAmount - partnerShareTotal - collaboratorShareTotal);

  return {
    totalRaised,
    platformFee,
    gatewayFees: Math.round(gatewayFees),
    netAmount,
    creatorShare,
    partnerShareTotal,
    collaboratorShareTotal,
    partners: partnerAllocations,
    collaborators: collaboratorAllocations
  };
}