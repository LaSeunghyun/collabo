import { PrismaClient, UserRole, ProjectStatus, PartnerType, OrderStatus, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('🧹 기존 테스트 데이터 정리...');
    
    // 기존 테스트 데이터 삭제
    await prisma.notification.deleteMany({
      where: { user: { email: { contains: 'test' } } }
    });
    await prisma.order.deleteMany({
      where: { user: { email: { contains: 'test' } } }
    });
    await prisma.project.deleteMany({
      where: { owner: { email: { contains: 'test' } } }
    });
    await prisma.partner.deleteMany({
      where: { user: { email: { contains: 'test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });

    console.log('👤 테스트 사용자 생성...');
    
    // 관리자 사용자
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: '관리자',
        role: UserRole.ADMIN,
        avatarUrl: 'https://via.placeholder.com/150'
      }
    });

    // 크리에이터 사용자
    const creator = await prisma.user.create({
      data: {
        email: 'creator@example.com',
        name: '크리에이터',
        role: UserRole.CREATOR,
        avatarUrl: 'https://via.placeholder.com/150'
      }
    });

    // 일반 사용자
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: '사용자',
        role: UserRole.PARTICIPANT,
        avatarUrl: 'https://via.placeholder.com/150'
      }
    });

    // 파트너 사용자
    const partner = await prisma.user.create({
      data: {
        email: 'partner@example.com',
        name: '파트너',
        role: UserRole.PARTNER,
        avatarUrl: 'https://via.placeholder.com/150'
      }
    });

    console.log('🎯 테스트 프로젝트 생성...');
    
    // 검토 대기 프로젝트
    const pendingProject = await prisma.project.create({
      data: {
        title: '검토 대기 프로젝트',
        description: '검토 대기 중인 프로젝트입니다.',
        category: 'MUSIC',
        targetAmount: 1000000,
        status: ProjectStatus.DRAFT,
        ownerId: creator.id,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // 진행 중인 프로젝트
    const liveProject = await prisma.project.create({
      data: {
        title: '진행 중인 프로젝트',
        description: '현재 진행 중인 프로젝트입니다.',
        category: 'ART',
        targetAmount: 2000000,
        status: ProjectStatus.LIVE,
        ownerId: creator.id,
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    });

    console.log('🤝 테스트 파트너 생성...');
    
    // 파트너 등록
    const testPartner = await prisma.partner.create({
      data: {
        userId: partner.id,
        type: PartnerType.STUDIO,
        name: '테스트 스튜디오',
        description: '테스트용 스튜디오입니다.',
        contactInfo: 'partner@example.com',
        location: '서울시 강남구',
        verified: false
      }
    });

    console.log('🛒 테스트 주문 생성...');
    
    // 테스트 주문
    const testOrder = await prisma.order.create({
      data: {
        userId: user.id,
        projectId: liveProject.id,
        totalPrice: 50000,
        subtotal: 45000,
        shippingCost: 5000,
        orderStatus: OrderStatus.PAID,
        shippingInfo: {
          name: '홍길동',
          phone: '010-1234-5678',
          address: '서울시 강남구'
        }
      }
    });

    console.log('🔔 테스트 알림 생성...');
    
    // 테스트 알림들
    await prisma.notification.createMany({
      data: [
        {
          userId: creator.id,
          type: NotificationType.FUNDING_SUCCESS,
          title: '펀딩 성공!',
          content: '프로젝트가 성공적으로 펀딩되었습니다.',
          isRead: false
        },
        {
          userId: user.id,
          type: NotificationType.NEW_COMMENT,
          title: '새 댓글',
          content: '게시글에 새 댓글이 달렸습니다.',
          isRead: false
        },
        {
          userId: admin.id,
          type: NotificationType.SYSTEM,
          title: '시스템 알림',
          content: '새로운 신고가 접수되었습니다.',
          isRead: false
        }
      ]
    });

    console.log('📊 테스트 정산 생성...');
    
    // 테스트 정산
    const testSettlement = await prisma.settlement.create({
      data: {
        projectId: liveProject.id,
        totalAmount: 2000000,
        platformFee: 100000,
        netAmount: 1900000,
        status: 'PENDING'
      }
    });

    await prisma.settlementPayout.create({
      data: {
        settlementId: testSettlement.id,
        stakeholderId: creator.id,
        stakeholderType: 'CREATOR',
        amount: 1900000,
        percentage: 100,
        status: 'PENDING'
      }
    });

    console.log('✅ 테스트 데이터 설정 완료!');
    console.log('👤 사용자:');
    console.log(`  - 관리자: admin@example.com`);
    console.log(`  - 크리에이터: creator@example.com`);
    console.log(`  - 사용자: user@example.com`);
    console.log(`  - 파트너: partner@example.com`);
    console.log('🔑 모든 사용자의 비밀번호: password123');

  } catch (error) {
    console.error('❌ 테스트 데이터 설정 실패:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
