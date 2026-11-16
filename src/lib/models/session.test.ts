import { expect, it } from 'vitest';
import { hashSessionSecret } from './session';

it('hashes the secret as lowercase hex SHA-256', () => {
  expect(hashSessionSecret('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  expect(hashSessionSecret('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
