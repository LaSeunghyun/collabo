import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { user as users, project as projects } from '@/drizzle/schema';

export async function POST() {
  try {
    console.log('🔐 테스트 계정 및 프로젝트 생성 시작...');

    const db = await getDb();

    // 기존 계정 확인
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@collabo.com')).limit(1);
    const existingCreator = await db.select().from(users).where(eq(users.email, 'creator@collabo.com')).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('⚠️ 관리자 계정이 이미 존재합니다:', existingAdmin[0].email);
    }
    if (existingCreator.length > 0) {
      console.log('⚠️ 크리에이터 계정이 이미 존재합니다:', existingCreator[0].email);
    }

    const hashedPassword = await hash('1234', 10);

    // 1. 관리자 계정 생성 (upsert)
    const admin = await db.insert(users)
      .values({
        id: 'admin-user-id',
        name: '관리자',
        email: 'admin@collabo.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        updatedAt: new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: '관리자',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          updatedAt: new Date().toISOString()
        }
      })
      .returning();
    console.log('✅ 관리자 계정 생성/업데이트 완료:', admin[0].email);

    // 2. 크리에이터 계정 생성 (upsert)
    const creator = await db.insert(users)
      .values({
        id: 'creator-user-id',
        name: '크리에이터',
        email: 'creator@collabo.com',
        passwordHash: hashedPassword,
        role: 'CREATOR',
        updatedAt: new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: '크리에이터',
          passwordHash: hashedPassword,
          role: 'CREATOR',
          updatedAt: new Date().toISOString()
        }
      })
      .returning();
    console.log('✅ 크리에이터 계정 생성/업데이트 완료:', creator[0].email);

    // 3. 테스트 프로젝트 생성
    console.log('\n🎨 테스트 프로젝트 생성 시작...');
    
    // 기존 프로젝트 확인
    const existingProjects = await db.select().from(projects).where(eq(projects.ownerId, creator[0].id));
    if (existingProjects.length > 0) {
      console.log('⚠️ 테스트 프로젝트가 이미 존재합니다:', existingProjects.length, '개');
      return NextResponse.json({ 
        message: '테스트 데이터가 이미 존재합니다.',
        accounts: { admin: admin[0].email, creator: creator[0].email },
        projects: existingProjects.length
      });
    }

    const testProjects = [
      {
        id: 'test-project-1',
        title: '인디 록 밴드 데뷔 앨범',
        description: '독창적인 사운드로 음악계에 새로운 바람을 불러일으킬 인디 록 밴드의 데뷔 앨범 제작을 위한 펀딩입니다. 10곡의 오리지널 곡과 함께 특별한 아트워크가 포함됩니다.',
        category: 'music',
        targetAmount: 2500000,
        currentAmount: 850000,
        thumbnail: 'https://picsum.photos/400/300?random=1',
        status: 'LIVE',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15일 전
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-project-2',
        title: '현대 미술 전시회 "디지털 꿈"',
        description: 'AI와 인간의 관계를 탐구하는 인터랙티브 미술 전시회입니다. VR, AR 기술을 활용한 몰입형 작품들을 통해 관객들이 새로운 경험을 할 수 있습니다.',
        category: 'art',
        targetAmount: 4000000,
        currentAmount: 2100000,
        thumbnail: 'https://picsum.photos/400/300?random=2',
        status: 'LIVE',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8일 전
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-project-3',
        title: '뮤지컬 "시간의 여행자"',
        description: '시간 여행을 소재로 한 오리지널 뮤지컬 제작입니다. 감동적인 스토리와 아름다운 음악으로 관객들에게 잊을 수 없는 경험을 선사할 예정입니다.',
        category: 'performance',
        targetAmount: 5000000,
        currentAmount: 1200000,
        thumbnail: 'https://picsum.photos/400/300?random=3',
        status: 'LIVE',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25일 전
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-project-4',
        title: '메타버스 콘서트 플랫폼',
        description: '가상현실에서 진행되는 혁신적인 콘서트 플랫폼 개발입니다. 전 세계 팬들이 함께 모여 아티스트의 공연을 즐길 수 있는 새로운 경험을 제공합니다.',
        category: 'tech',
        targetAmount: 3000000,
        currentAmount: 450000,
        thumbnail: 'https://picsum.photos/400/300?random=4',
        status: 'LIVE',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 전
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-project-5',
        title: 'K-POP 댄스 워크샵 시리즈',
        description: '전문 댄서들과 함께하는 K-POP 댄스 워크샵 시리즈입니다. 초보자부터 고급자까지 모든 레벨의 참가자를 위한 체계적인 커리큘럼을 제공합니다.',
        category: 'performance',
        targetAmount: 1800000,
        currentAmount: 720000,
        thumbnail: 'https://picsum.photos/400/300?random=5',
        status: 'LIVE',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12일 전
        updatedAt: new Date().toISOString()
      }
    ];

    const createdProjects = [];
    for (const projectData of testProjects) {
      const [project] = await db.insert(projects).values({
        ...projectData,
        ownerId: creator[0].id,
        currency: 'KRW'
      }).returning();
      createdProjects.push(project);
      console.log(`✅ 프로젝트 생성 완료: ${projectData.title}`);
    }

    console.log('🎉 모든 테스트 계정과 프로젝트가 성공적으로 생성되었습니다!');

    return NextResponse.json({
      message: '테스트 데이터 생성 완료',
      accounts: {
        admin: admin[0].email,
        creator: creator[0].email
      },
      projects: createdProjects.length,
      projectTitles: createdProjects.map(p => p.title)
    });

  } catch (error) {
    console.error('❌ 테스트 데이터 생성 중 오류 발생:', error);
    return NextResponse.json(
      { 
        message: '테스트 데이터 생성 실패', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
