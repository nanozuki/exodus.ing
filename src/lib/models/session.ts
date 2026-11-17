import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';

// The secret itself is never stored, so no stored field forms a working token.
export type Session = {
  id: string;
  userId: string;
  secretHash: string;
  expiresAt: Date;
};

// The value stored as `Session.secretHash`.
export function hashSessionSecret(secret: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(secret)));
}
