import { customAlphabet } from 'nanoid';

// Every application-generated random value has a named method here, so its format is reviewed in one place.
// Use cases declare `random: Random` in their deps; tests supply fixed values.
export interface Random {
  // A lookup key, not a credential.
  sessionId(): string;
  // 32 secure random bytes as unpadded base64url (43 characters, never containing `.`).
  sessionSecret(): string;
}

const sessionId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 32);

export const random: Random = {
  sessionId,
  sessionSecret() {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
  },
};
