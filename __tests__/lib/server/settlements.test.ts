import { calculateSettlementBreakdown } from '@/lib/server/settlements';

const buildParams = () => ({
  totalRaised: 100000,
  platformFeeRate: 0.05,
  gatewayFees: 2000
});

describe('calculateSettlementBreakdown', () => {
  it('throws when totalRaised is not positive', () => {
    expect(() =>
      calculateSettlementBreakdown({
        totalRaised: 0,
        platformFeeRate: 0.1
      })
    ).toThrow(Error);
  });

  it('throws when platform fee rate is out of bounds', () => {
    expect(() =>
      calculateSettlementBreakdown({
        totalRaised: 1000,
        platformFeeRate: 1.2
      })
    ).toThrow(Error);
  });

  it('throws when combined partner and collaborator share exceeds 100%', () => {
    expect(() =>
      calculateSettlementBreakdown({
        totalRaised: 1000,
        platformFeeRate: 0.1,
        partnerShares: [{ stakeholderId: 'partner', share: 0.7 }],
        collaboratorShares: [{ stakeholderId: 'collab', share: 0.35 }]
      })
    ).toThrow(Error);
  });

  it('applies platform and gateway fees before computing creator share', () => {
    const result = calculateSettlementBreakdown(buildParams());

    expect(result.platformFee).toBe(5000);
    expect(result.gatewayFees).toBe(2000);
    expect(result.netAmount).toBe(93000);
    expect(result.creatorShare).toBe(93000);
  });

  it('distributes remainder cents based on fractional weights', () => {
    const result = calculateSettlementBreakdown({
      totalRaised: 10003,
      platformFeeRate: 0,
      gatewayFees: 0,
      partnerShares: [
        { stakeholderId: 'alpha', share: 0.6 },
        { stakeholderId: 'beta', share: 0.3 }
      ],
      collaboratorShares: [{ stakeholderId: 'gamma', share: 0.1 }]
    });

    const totalAllocated =
      result.partnerShareTotal + result.collaboratorShareTotal + result.creatorShare;

    expect(Math.abs(totalAllocated - result.netAmount)).toBeLessThanOrEqual(1);
    expect(result.partners).toHaveLength(2);
    expect(result.collaborators).toHaveLength(1);
    expect(result.partners[0].amount).not.toEqual(result.partners[1].amount);
  });

  it('ignores zero or negative share entries', () => {
    const result = calculateSettlementBreakdown({
      totalRaised: 20000,
      platformFeeRate: 0,
      gatewayFees: 0,
      partnerShares: [
        { stakeholderId: 'valid', share: 0.2 },
        { stakeholderId: 'zero', share: 0 }
      ],
      collaboratorShares: [
        { stakeholderId: 'negative', share: -0.1 },
        { stakeholderId: 'valid-c', share: 0.1 }
      ]
    });

    expect(result.partners).toHaveLength(1);
    expect(result.collaborators).toHaveLength(1);
    expect(result.partnerShareTotal + result.collaboratorShareTotal + result.creatorShare).toBe(
      result.netAmount
    );
  });
});

