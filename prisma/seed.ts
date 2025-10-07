import type { Prisma as PrismaSeedTypes } from '@prisma/client';

import {
  FundingStatus,
  MilestoneStatus,
  OrderStatus,
  PartnerMatchStatus,
  PartnerType,
  PaymentProvider,
  PostType,
  ProductType,
  ProjectStatus,
  SettlementPayoutStatus,
  SettlementStakeholderType,
  UserRole
} from '../types/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoPasswordHash = '$argon2id$v=19$m=65536,t=3,p=4$demo$demoHashShouldBeReplaced';

async function upsertUser(
  data: PrismaSeedTypes.UserCreateInput & { email: string }
) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: data,
    create: data
  });
}

async function seedUsers() {
  const [admin, creator, participant, partnerUser] = await Promise.all([
    upsertUser({
      email: 'admin@collabo.local',
      name: 'Admin',
      role: UserRole.ADMIN,
      passwordHash: demoPasswordHash,
      language: 'ko'
    }),
    upsertUser({
      email: 'creator@collabo.local',
      name: '?€???¬ë¦¬?ì´??,
      role: UserRole.CREATOR,
      passwordHash: demoPasswordHash,
      language: 'ko'
    }),
    upsertUser({
      email: 'participant@collabo.local',
      name: '?´ì„± ì°¸ì—¬??,
      role: UserRole.PARTICIPANT,
      passwordHash: demoPasswordHash,
      language: 'ko'
    }),
    upsertUser({
      email: 'partner@collabo.local',
      name: 'ë¯¿ìŒì§í•œ ?ŒíŠ¸??,
      role: UserRole.PARTNER,
      passwordHash: demoPasswordHash,
      language: 'ko'
    })
  ]);

  return { admin, creator, participant, partnerUser };
}

async function seedPartner(userId: string) {
  return prisma.partner.upsert({
    where: { userId },
    update: {
      verified: true,
      rating: 4.8
    },
    create: {
      user: { connect: { id: userId } },
      type: PartnerType.STUDIO,
      name: '?œìš¸ ?¬ìš´???¤íŠœ?”ì˜¤',
      description: '?¹ìŒ, ë¯¹ì‹±, ë§ˆìŠ¤?°ë§ ?€?œë¹„???¤íŠœ?”ì˜¤',
      services: ['?¹ìŒ', 'ë¯¹ì‹±', 'ë§ˆìŠ¤?°ë§'],
      pricingModel: 'package',
      contactInfo: 'studio@example.com',
      location: '?œìš¸ ë§ˆí¬êµ?,
      verified: true,
      availability: ['weekday-evening', 'weekend'],
      portfolioUrl: 'https://example.com/portfolio'
    }
  });
}

async function seedProject(creatorId: string) {
  return prisma.project.upsert({
    where: { id: 'demo-project' },
    update: {},
    create: {
      id: 'demo-project',
      title: 'ì½œë¼ë³?ì²?ë²ˆì§¸ ?„í‹°?¤íŠ¸ ?€??,
      description: 'ì²??±ê? ë°œë§¤ë¥??„í•œ ?¹ìŒê³??ë³´ ?ê¸ˆ ëª¨ê¸ˆ',
      category: 'music',
      targetAmount: 5000000,
      currentAmount: 2500000,
      currency: 'KRW',
      status: ProjectStatus.LIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      rewardTiers: [
        { id: 'tier-1', amount: 10000, title: '?”ì????Œì›', limit: null },
        { id: 'tier-2', amount: 50000, title: '?¬ì¸ CD', limit: 200 }
      ],
      milestones: [
        { id: 'ms-1', title: '?±ê? ?¹ìŒ ?„ë£Œ', amount: 2000000 },
        { id: 'ms-2', title: 'ë®¤ì§ë¹„ë””??ì´¬ì˜', amount: 3000000 }
      ],
      metadata: {
        themeColor: '#ff4971'
      },
      owner: { connect: { id: creatorId } }
    }
  });
}

async function seedProjectDetails(projectId: string) {
  await prisma.projectRequirement.upsert({
    where: { id: 'demo-project-requirement' },
    update: {},
    create: {
      id: 'demo-project-requirement',
      project: { connect: { id: projectId } },
      category: 'studio',
      minBudget: 2000000,
      maxBudget: 4000000,
      location: '?œìš¸',
      services: ['?¹ìŒ', 'ë¯¹ì‹±'],
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });

  await prisma.projectMilestone.upsert({
    where: { id: 'demo-project-milestone' },
    update: {
      status: MilestoneStatus.IN_PROGRESS
    },
    create: {
      id: 'demo-project-milestone',
      project: { connect: { id: projectId } },
      title: '?¹ìŒ ?¸ì…˜ ?ˆì•½',
      description: '?ŒíŠ¸???¤íŠœ?”ì˜¤?€ ?¹ìŒ???•ì •',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      releaseAmount: 1500000,
      status: MilestoneStatus.PLANNED
    }
  });

  await prisma.projectRewardTier.upsert({
    where: { id: 'demo-project-tier' },
    update: {
      claimed: 40
    },
    create: {
      id: 'demo-project-tier',
      project: { connect: { id: projectId } },
      title: '?¼ì´ë¸??¼ì??´ìŠ¤ ì´ˆë?',
      description: '?¼ì??´ìŠ¤ ì´ˆë?ê¶Œê³¼ ?¬ì¸ ?¬ìŠ¤??ì¦ì •',
      minimumAmount: 100000,
      limit: 200,
      claimed: 40,
      includes: ['?…ìž¥ê¶?, '?¬ì¸ ?¬ìŠ¤??],
      estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
    }
  });
}

async function seedFunding(
  projectId: string,
  creatorId: string,
  participantId: string,
  partnerId: string
) {
  const funding = await prisma.funding.upsert({
    where: { id: 'demo-funding' },
    update: {},
    create: {
      id: 'demo-funding',
      project: { connect: { id: projectId } },
      user: { connect: { id: participantId } },
      amount: 200000,
      currency: 'KRW',
      paymentStatus: FundingStatus.SUCCEEDED,
      metadata: { rewardTierId: 'demo-project-tier' }
    }
  });

  await prisma.paymentTransaction.upsert({
    where: { fundingId: funding.id },
    update: {},
    create: {
      funding: { connect: { id: funding.id } },
      provider: PaymentProvider.STRIPE,
      externalId: 'pi_demo_123',
      status: funding.paymentStatus,
      amount: funding.amount,
      currency: funding.currency,
      gatewayFee: 6000
    }
  });

  const settlement = await prisma.settlement.upsert({
    where: { id: 'demo-settlement' },
    update: {},
    create: {
      id: 'demo-settlement',
      project: { connect: { id: projectId } },
      totalRaised: 2500000,
      platformFee: 125000,
      gatewayFees: 30000,
      netAmount: 2345000,
      creatorShare: 1800000,
      partnerShare: 400000,
      collaboratorShare: 145000,
      payoutStatus: SettlementPayoutStatus.IN_PROGRESS,
      distributionBreakdown: [
        { type: 'CREATOR', amount: 1800000 },
        { type: 'PARTNER', amount: 400000 },
        { type: 'COLLABORATOR', amount: 145000 },
        { type: 'PLATFORM', amount: 125000 }
      ]
    }
  });

  await prisma.settlementPayout.upsert({
    where: { id: 'demo-settlement-payout-creator' },
    update: {},
    create: {
      id: 'demo-settlement-payout-creator',
      settlement: { connect: { id: settlement.id } },
      stakeholderType: SettlementStakeholderType.CREATOR,
      stakeholderId: creatorId,
      amount: 1800000,
      status: SettlementPayoutStatus.IN_PROGRESS
    }
  });

  await prisma.settlementPayout.upsert({
    where: { id: 'demo-settlement-payout-partner' },
    update: {},
    create: {
      id: 'demo-settlement-payout-partner',
      settlement: { connect: { id: settlement.id } },
      stakeholderType: SettlementStakeholderType.PARTNER,
      stakeholderId: partnerId,
      amount: 400000,
      status: SettlementPayoutStatus.PENDING
    }
  });

  await prisma.partnerMatch.upsert({
    where: { id: 'demo-partner-match' },
    update: {},
    create: {
      id: 'demo-partner-match',
      project: { connect: { id: projectId } },
      partner: { connect: { id: partnerId } },
      status: PartnerMatchStatus.ACCEPTED,
      settlementShare: 0.15,
      quote: 3500000,
      requirements: ['24ì±„ë„ ?¹ìŒ', 'ë¯¹ì‹± 2???˜ì •'],
      acceptedAt: new Date()
    }
  });
}

async function seedProducts(projectId: string, participantId: string) {
  const product = await prisma.product.upsert({
    where: { id: 'demo-product' },
    update: {},
    create: {
      id: 'demo-product',
      project: { connect: { id: projectId } },
      name: 'ì½œë¼ë³??œì • ?°ì…”ì¸?,
      type: ProductType.PHYSICAL,
      price: 35000,
      currency: 'KRW',
      inventory: 200,
      images: ['https://example.com/tshirt.png'],
      sku: 'COLLABO-TEE-001'
    }
  });

  const order = await prisma.order.upsert({
    where: { id: 'demo-order' },
    update: {},
    create: {
      id: 'demo-order',
      user: { connect: { id: participantId } },
      totalPrice: 45000,
      subtotal: 35000,
      shippingCost: 5000,
      taxAmount: 5000,
      currency: 'KRW',
      orderStatus: OrderStatus.PAID,
      shippingInfo: {
        recipient: '?´ì„± ì°¸ì—¬??,
        address: '?œìš¸??ê°•ë‚¨êµ?123-1',
        contact: '010-0000-0000'
      }
    }
  });

  await prisma.orderItem.upsert({
    where: { id: 'demo-order-item' },
    update: {},
    create: {
      id: 'demo-order-item',
      order: { connect: { id: order.id } },
      product: { connect: { id: product.id } },
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price
    }
  });
}

async function seedCommunity(projectId: string, creatorId: string, participantId: string) {
  const post = await prisma.post.upsert({
    where: { id: 'demo-post' },
    update: {},
    create: {
      id: 'demo-post',
      project: { connect: { id: projectId } },
      author: { connect: { id: creatorId } },
      title: 'ì²?ì£??€???„í™© ê³µìœ ',
      content: '?¬ëŸ¬ë¶„ì˜ ?‘ì› ?•ë¶„??50% ?¬ì„±! ?¤ìŒ ì£¼ëŠ” ?¼ì´ë¸?ë°©ì†¡?¼ë¡œ ì°¾ì•„ëµê²Œ??',
      type: PostType.UPDATE,
      tags: ['update', 'milestone'],
      publishedAt: new Date(),
      isPinned: true
    }
  });

  await prisma.comment.upsert({
    where: { id: 'demo-comment' },
    update: {},
    create: {
      id: 'demo-comment',
      post: { connect: { id: post.id } },
      author: { connect: { id: participantId } },
      content: '?‘ì›?©ë‹ˆ?? ?¼ì´ë¸Œì—??ë§Œë‚˜??'
    }
  });

  await prisma.postLike.upsert({
    where: { postId_userId: { postId: post.id, userId: participantId } },
    update: {},
    create: {
      post: { connect: { id: post.id } },
      user: { connect: { id: participantId } }
    }
  });
}

async function seedFollows(creatorId: string, participantId: string) {
  await prisma.userFollow.upsert({
    where: { followerId_followingId: { followerId: participantId, followingId: creatorId } },
    update: {},
    create: {
      follower: { connect: { id: participantId } },
      following: { connect: { id: creatorId } }
    }
  });
}

async function main() {
  const { creator, participant, partnerUser } = await seedUsers();
  const partner = await seedPartner(partnerUser.id);
  const project = await seedProject(creator.id);
  await seedProjectDetails(project.id);
  await seedFunding(project.id, creator.id, participant.id, partner.id);
  await seedProducts(project.id, participant.id);
  await seedCommunity(project.id, creator.id, participant.id);
  await seedFollows(creator.id, participant.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Failed to seed database', error);
    await prisma.$disconnect();
    process.exit(1);
  });
