import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const projectRoot = new URL('../../', import.meta.url);

for (const command of ['dev', 'pg:status', 'pg:stop', 'pg:reset']) {
  test(`${command} loads database tooling without generated SvelteKit configuration`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'exodus-bootstrap-'));
    try {
      await cp(new URL('src/', projectRoot), join(root, 'src'), { recursive: true });
      for (const file of ['package.json', 'tsconfig.json', 'vite.config.ts']) {
        await cp(new URL(file, projectRoot), join(root, file));
      }
      await symlink(fileURLToPath(new URL('node_modules', projectRoot)), join(root, 'node_modules'));

      // Stop at the process boundary so the real module graph loads without starting a database.
      const bin = join(root, 'bin');
      await mkdir(bin);
      const marker = 'Bootstrap reached PostgreSQL provisioning';
      await writeFile(join(bin, 'nix'), `#!/bin/sh\necho '${marker}' >&2\nexit 1\n`, { mode: 0o755 });

      const args = ['run', command];
      if (command === 'pg:reset') args.push('bootstrap');
      await assert.rejects(
        exec('pnpm', args, {
          cwd: root,
          env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
          timeout: 30_000,
        }),
        (error: unknown) => {
          assert.match((error as { stderr: string }).stderr, new RegExp(marker));
          return true;
        },
      );
      await assert.rejects(access(join(root, '.svelte-kit')), { code: 'ENOENT' });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
