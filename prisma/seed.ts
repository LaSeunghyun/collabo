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
  UserRole,
  PrismaClient,
  type Prisma
} from '@/types/prisma';

const prisma = new PrismaClient();

const demoPasswordHash = '$argon2id$v=19$m=65536,t=3,p=4$demo$demoHashShouldBeReplaced';

async function upsertUser(
  data: Prisma.UserCreateInput & { email: string }
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
      name: '대표 크리에이터',
      role: UserRole.CREATOR,
      passwordHash: demoPasswordHash,
      language: 'ko'
    }),
    upsertUser({
      email: 'participant@collabo.local',
      name: '열성 참여자',
      role: UserRole.PARTICIPANT,
      passwordHash: demoPasswordHash,
      language: 'ko'
    }),
    upsertUser({
      email: 'partner@collabo.local',
      name: '믿음직한 파트너',
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
      name: '서울 사운드 스튜디오',
      description: '녹음, 믹싱, 마스터링 풀서비스 스튜디오',
      services: ['녹음', '믹싱', '마스터링'],
      pricingModel: 'package',
      contactInfo: 'studio@example.com',
      location: '서울 마포구',
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
      title: '콜라보 첫 번째 아티스트 펀딩',
      description: '첫 싱글 발매를 위한 녹음과 홍보 자금 모금',
      category: 'music',
      targetAmount: 5000000,
      currentAmount: 2500000,
      currency: 'KRW',
      status: ProjectStatus.LIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      rewardTiers: [
        { id: 'tier-1', amount: 10000, title: '디지털 음원', limit: null },
        { id: 'tier-2', amount: 50000, title: '사인 CD', limit: 200 }
      ],
      milestones: [
        { id: 'ms-1', title: '싱글 녹음 완료', amount: 2000000 },
        { id: 'ms-2', title: '뮤직비디오 촬영', amount: 3000000 }
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
      location: '서울',
      services: ['녹음', '믹싱'],
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
      title: '녹음 세션 예약',
      description: '파트너 스튜디오와 녹음일 확정',
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
      title: '라이브 쇼케이스 초대',
      description: '쇼케이스 초대권과 사인 포스터 증정',
      minimumAmount: 100000,
      limit: 200,
      claimed: 40,
      includes: ['입장권', '사인 포스터'],
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
      requirements: ['24채널 녹음', '믹싱 2회 수정'],
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
      name: '콜라보 한정 티셔츠',
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
        recipient: '열성 참여자',
        address: '서울시 강남구 123-1',
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
      title: '첫 주 펀딩 현황 공유',
      content: '여러분의 응원 덕분에 50% 달성! 다음 주는 라이브 방송으로 찾아뵐게요.',
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
      content: '응원합니다! 라이브에서 만나요!'
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
