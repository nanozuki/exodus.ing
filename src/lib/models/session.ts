import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';

/**
 * A persisted session. `id` is a non-secret lookup key and `secretHash` is `hashSessionSecret` of the secret. The
 * secret itself is never stored, so no stored field forms a working token.
 */
export type Session = {
  id: string;
  userId: string;
  secretHash: string;
  expiresAt: Date;
};

/**
 * Returns the lowercase hexadecimal SHA-256 digest of the secret's UTF-8 bytes, the value stored as
 * `Session.secretHash`. Session creation and verification both use it.
 */
export function hashSessionSecret(secret: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(secret)));
}
