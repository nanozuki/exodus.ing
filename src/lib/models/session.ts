import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { z } from 'zod';
import { identityProviderSchema } from './user';

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

/** The flow a pre-auth session belongs to; it determines the session's payload shape. */
export enum PreAuthPurpose {
  SignUp = 'sign_up',
}

/**
 * Parses each purpose's payload, the source of its `PreAuthPayload` type. A `sign_up` payload holds the verified
 * identity, the provider's suggested `username` and `name`, and the requested post-sign-in `next`, unsanitized.
 */
export const preAuthPayloadSchemas = {
  [PreAuthPurpose.SignUp]: z.object({
    identity: z.object({ provider: identityProviderSchema, subject: z.string() }),
    hints: z.object({ username: z.string().optional(), name: z.string().optional() }),
    next: z.string().optional(),
  }),
} satisfies { [P in PreAuthPurpose]: z.ZodType };

export type PreAuthPayload<P extends PreAuthPurpose> = z.infer<(typeof preAuthPayloadSchemas)[P]>;

/**
 * A persisted pre-auth session: short-lived, single-use state for a flow that runs before an auth session exists. `id`
 * is a non-secret lookup key and `secretHash` is `hashSessionSecret` of the secret; the secret itself is never stored.
 * Without a type argument it is a union discriminated by `purpose`, whose `payload` has that purpose's shape.
 */
export type PreAuthSession<P extends PreAuthPurpose = PreAuthPurpose> = {
  [K in P]: { id: string; purpose: K; secretHash: string; payload: PreAuthPayload<K>; expiresAt: Date };
}[P];

/**
 * Returns the lowercase hexadecimal SHA-256 digest of the secret's UTF-8 bytes, the value stored as
 * `Session.secretHash` and `PreAuthSession.secretHash`. Session creation and verification both use it.
 */
export function hashSessionSecret(secret: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(secret)));
}
