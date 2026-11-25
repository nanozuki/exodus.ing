import { describe, expect, it } from 'vitest';
import { getConfig } from './config';

const env = {
  GITHUB_CLIENT_ID: 'client',
  GITHUB_CLIENT_SECRET: '',
  APP_URL: 'https://exodus.test',
  PGHOST: 'localhost',
  PGPORT: '5432',
  PGUSER: 'exodus',
  PGPASSWORD: 'secret',
  PGDATABASE: 'exodus',
};

describe('getConfig', () => {
  it('reads every variable, accepting an empty string and converting the port', () => {
    expect(getConfig(env)).toEqual({
      githubClientId: 'client',
      githubClientSecret: '',
      appUrl: 'https://exodus.test',
      database: {
        host: 'localhost',
        port: 5432,
        user: 'exodus',
        password: 'secret',
        database: 'exodus',
        enableChannelBinding: false,
      },
    });
  });

  it('throws MISSING_CONFIG naming a missing variable', () => {
    expect(() => getConfig({ ...env, PGHOST: undefined })).toThrow(
      expect.objectContaining({
        body: expect.objectContaining({ detail: { tag: 'MISSING_CONFIG', value: { item: 'PGHOST' } } }),
      }),
    );
  });

  it.each(['', 'abc', '5432.5', '0', '65536', '0x1538', '5e3', ' 5432 '])(
    'throws MISSING_CONFIG on PGPORT for port %j',
    (PGPORT) => {
      expect(() => getConfig({ ...env, PGPORT })).toThrow(
        expect.objectContaining({
          body: expect.objectContaining({ detail: { tag: 'MISSING_CONFIG', value: { item: 'PGPORT' } } }),
        }),
      );
    },
  );

  it.each([
    ['prefer', true],
    ['require', true],
    ['disable', false],
    [undefined, false],
  ])('maps PGCHANNELBINDING %j to channel binding %j', (PGCHANNELBINDING, enabled) => {
    expect(getConfig({ ...env, PGCHANNELBINDING }).database.enableChannelBinding).toBe(enabled);
  });
});
