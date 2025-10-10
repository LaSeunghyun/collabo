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
  console.log('?�� 커�??�티 DB ?�결 ?�태 ?��????�작?�니??');

  try {
    const db = await getDb();
    console.log('??Drizzle ?�라?�언???�성 ?�료');

    const [userStats] = await db.select({ total: count() }).from(users);
    console.log(`?�� ?�록???�용???? ${userStats?.total ?? 0}`);

    const [postStats] = await db.select({ total: count() }).from(posts);
    console.log(`?�� 게시글 �??? ${postStats?.total ?? 0}`);

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
      console.log('?�� 가??최근 게시글 ?�플:');
      console.table(
        Object.entries(recentPost).map(([key, value]) => ({
          field: key,
          value: formatResult(value),
        }))
      );
    } else {
      console.log('?�️ 게시글??존재?��? ?�습?�다. QA ?�에 ?�플 ?�이?��? ?�성?�세??');
    }
  } catch (error) {
    console.error('??DB ?��? �??�류가 발생?�습?�다.');
    console.error(error);
    process.exitCode = 1;
  }
}

void main();
