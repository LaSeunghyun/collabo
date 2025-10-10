import { calculateSettlementBreakdown } from '@/lib/server/settlements';

describe('calculateSettlementBreakdown', () => {
  it('distributes amounts based on platform, partners, and collaborators', () => {
    const breakdown = calculateSettlementBreakdown({
      totalRaised: 1_000_000,
      platformFeeRate: 0.05,
      gatewayFees: 20_000,
      partnerShares: [
        { stakeholderId: 'partner-a', share: 0.2 },
        { stakeholderId: 'partner-b', share: 0.1 }
      ],
      collaboratorShares: [{ stakeholderId: 'collab-a', share: 0.15 }]
    });

    expect(breakdown.totalRaised).toBe(1_000_000);
    expect(breakdown.platformFee).toBe(50_000);
    expect(breakdown.gatewayFees).toBe(20_000);
    expect(breakdown.netAmount).toBe(930_000);

    const partnerTotal = breakdown.partners.reduce((acc, item) => acc + item.amount, 0);
    const collaboratorTotal = breakdown.collaborators.reduce((acc, item) => acc + item.amount, 0);

    expect(partnerTotal).toBe(breakdown.partnerShareTotal);
    expect(collaboratorTotal).toBe(breakdown.collaboratorShareTotal);
    expect(breakdown.creatorShare + partnerTotal + collaboratorTotal).toBe(breakdown.netAmount);
  });

  it('throws if the combined share exceeds 100%', () => {
    expect(() =>
      calculateSettlementBreakdown({
        totalRaised: 100_000,
        platformFeeRate: 0.05,
        partnerShares: [{ stakeholderId: 'partner-a', share: 0.8 }],
        collaboratorShares: [{ stakeholderId: 'collab-a', share: 0.3 }]
      })
    ).toThrow('?ŒíŠ¸?ˆì? ?‘ë ¥??ë°°ë¶„ ë¹„ìœ¨???©ì´ 100%ë¥?ì´ˆê³¼?ˆìŠµ?ˆë‹¤.');
  });

  it('handles rounding so that totals equal the net amount', () => {
    const breakdown = calculateSettlementBreakdown({
      totalRaised: 101,
      platformFeeRate: 0,
      partnerShares: [
        { stakeholderId: 'partner-a', share: 0.3333 },
        { stakeholderId: 'partner-b', share: 0.3333 },
        { stakeholderId: 'partner-c', share: 0.3333 }
      ]
    });

    const partnerTotal = breakdown.partnerShareTotal;
    expect(partnerTotal).toBe(breakdown.netAmount);
    expect(partnerTotal).toBe(101);
  });
});
