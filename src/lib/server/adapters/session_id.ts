import { customAlphabet } from 'nanoid';

const generate = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 32);

// IDs contain 32 lowercase alphanumeric characters.
export function generateSessionId(): string {
  return generate();
}
