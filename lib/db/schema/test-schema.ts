import { pgTable, text, integer } from 'drizzle-orm/pg-core';

export const testTable = pgTable('test', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  value: integer('value').notNull(),
});
