import { getDbClient } from '@/lib/db/client';
import { categories } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

async function seedCommunityCategories() {
  try {
    const db = await getDbClient();
    console.log('커뮤니티 카테고리 시드 데이터 생성 시작...');

    const categoryData = [
      {
        id: nanoid(),
        slug: 'free',
        name: '자유',
        description: '일반 소통, 잡담',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        slug: 'question',
        name: '질문',
        description: 'Q&A, 정보요청',
        displayOrder: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        slug: 'review',
        name: '후기',
        description: '공연/굿즈/참여 경험',
        displayOrder: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        slug: 'suggestion',
        name: '제안',
        description: '기능/정책/운영 제안',
        displayOrder: 4,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        slug: 'recruitment',
        name: '모집',
        description: '협업/세션/파트너 구인',
        displayOrder: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        slug: 'trade',
        name: '거래',
        description: '티켓 교환/중고 굿즈',
        displayOrder: 6,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nanoid(),
        slug: 'info-share',
        name: '정보공유',
        description: '팁, 튜토리얼, 링크',
        displayOrder: 7,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // 기존 카테고리 삭제 (있다면)
    await db.delete(categories);
    console.log('기존 카테고리 삭제 완료');

    // 새 카테고리 삽입
    await db.insert(categories).values(categoryData);
    console.log('새 카테고리 삽입 완료');

    console.log('커뮤니티 카테고리 시드 데이터 생성 완료!');
    console.log('생성된 카테고리:', categoryData.map(c => `${c.name} (${c.slug})`).join(', '));
  } catch (error) {
    console.error('시드 데이터 생성 오류:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  seedCommunityCategories()
    .then(() => {
      console.log('시드 데이터 생성이 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('시드 데이터 생성 실패:', error);
      process.exit(1);
    });
}

export { seedCommunityCategories };