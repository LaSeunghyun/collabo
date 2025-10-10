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
  console.log('?©º ì»¤ë??ˆí‹° DB ?°ê²° ?íƒœ ?ê????œì‘?©ë‹ˆ??');

  try {
    const db = await getDb();
    console.log('??Drizzle ?´ë¼?´ì–¸???ì„± ?„ë£Œ');

    const [userStats] = await db.select({ total: count() }).from(users);
    console.log(`?‘¥ ?±ë¡???¬ìš©???? ${userStats?.total ?? 0}`);

    const [postStats] = await db.select({ total: count() }).from(posts);
    console.log(`?“ ê²Œì‹œê¸€ ì´??? ${postStats?.total ?? 0}`);

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
      console.log('?“Œ ê°€??ìµœê·¼ ê²Œì‹œê¸€ ?˜í”Œ:');
      console.table(
        Object.entries(recentPost).map(([key, value]) => ({
          field: key,
          value: formatResult(value),
        }))
      );
    } else {
      console.log('?¹ï¸ ê²Œì‹œê¸€??ì¡´ì¬?˜ì? ?ŠìŠµ?ˆë‹¤. QA ?„ì— ?˜í”Œ ?°ì´?°ë? ?ì„±?˜ì„¸??');
    }
  } catch (error) {
    console.error('??DB ?ê? ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
    console.error(error);
    process.exitCode = 1;
  }
}

void main();
