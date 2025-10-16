import 'dotenv/config';

import { count, desc } from 'drizzle-orm';

import { getDb } from '../lib/db/client';
import { posts, users } from '../lib/db/schema';

const formatResult = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
};

async function main() {
  console.log('🩺 커뮤니티 DB 연결 상태 점검을 시작합니다.');

  try {
    const db = await getDb();
    console.log('✅ Drizzle 클라이언트 생성 완료');

    const [userStats] = await db.select({ total: count() }).from(users);
    console.log(`👥 등록된 사용자 수: ${userStats?.total ?? 0}`);

    const [postStats] = await db.select({ total: count() }).from(posts);
    console.log(`📝 게시글 총 수: ${postStats?.total ?? 0}`);

    const [recentPost] = await db
      .select({
        id: posts.id,
        title: posts.title,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(1);

    if (recentPost) {
      console.log('📌 가장 최근 게시글 샘플:');
      console.table(
        Object.entries(recentPost).map(([key, value]) => ({
          field: key,
          value: formatResult(value),
        }))
      );
    } else {
      console.log('ℹ️ 게시글이 존재하지 않습니다. QA 전에 샘플 데이터를 생성하세요.');
    }
  } catch (error) {
    console.error('❌ DB 점검 중 오류가 발생했습니다.');
    console.error(error);
    process.exitCode = 1;
  }
}

void main();
