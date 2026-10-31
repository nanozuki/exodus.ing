import { expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { createTestDatabase } from './database';
import { tUser } from '#lib/server/db/schema.js';

it('isolates concurrent clones, preserves connection environment, and closes only its owned clone', async () => {
  const environment = { ...process.env };
  const first = await createTestDatabase('Same suite: spaces / unicode 测试');
  let second: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
  try {
    second = await createTestDatabase('Same suite: spaces / unicode 测试');
    const firstName = (await first.db.execute(sql`select current_database() as name`)).rows[0].name;
    const secondName = (await second.db.execute(sql`select current_database() as name`)).rows[0].name;
    expect(firstName).not.toBe(secondName);
    await first.db.delete(tUser);
    expect(await second.db.$count(tUser)).toBe(6);
    expect(process.env).toEqual(environment);
    await first.close();
    await first.close();
    const databases = await second.db.execute(sql`select datname from pg_database where datname = ${firstName}`);
    expect(databases.rows).toEqual([]);
    expect(await second.db.$count(tUser)).toBe(6);
  } finally {
    await first.close();
    await second?.close();
  }
}, 120_000);
