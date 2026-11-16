import { expect, it } from 'vitest';
import { random } from './random';

it('generates 32-character lowercase alphanumeric session IDs', () => {
  expect(random.sessionId()).toMatch(/^[0-9a-z]{32}$/);
});

it('generates 32-byte base64url session secrets that never contain the token separator', () => {
  const secret = random.sessionSecret();
  expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(Buffer.from(secret, 'base64url')).toHaveLength(32);
  expect(random.sessionSecret()).not.toBe(secret);
});
