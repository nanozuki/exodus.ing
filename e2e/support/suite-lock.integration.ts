import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const config = join(root, 'playwright.config.ts');
const lock = join(root, '.direnv/e2e-suite.lock');

function playwright(args: string[]): string {
  try {
    return execFileSync('pnpm', ['exec', 'playwright', 'test', '--config', config, ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30_000,
    });
  } catch (error) {
    const output = error as { stdout?: string; stderr?: string };
    throw new Error(`${output.stdout ?? ''}\n${output.stderr ?? ''}`, { cause: error });
  }
}

test('an overlapping run preserves existing traces and the original lock', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'exodus-e2e-overlap-'));
  mkdirSync(join(root, '.direnv'), { recursive: true });
  mkdirSync(lock);
  const owner = `${process.pid}\n`;
  writeFileSync(join(lock, 'owner'), owner);
  try {
    const output = join(scratch, 'output');
    mkdirSync(output);
    const trace = join(output, 'trace.zip');
    writeFileSync(trace, 'existing trace');
    assert.throws(() => playwright(['--output', output]), /An E2E suite already owns/);
    assert.equal(readFileSync(trace, 'utf8'), 'existing trace');
    assert.equal(readFileSync(join(lock, 'owner'), 'utf8'), owner);
  } finally {
    rmSync(lock, { recursive: true });
    rmSync(scratch, { recursive: true });
  }
});

test('listing tests releases the configuration-time lock on exit', () => {
  assert.match(playwright(['--list']), /Total: \d+ tests/);
  assert.equal(existsSync(lock), false);
});

test('discovery inherits ownership and setup failure still releases the lock', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'exodus-e2e-setup-'));
  try {
    writeFileSync(join(scratch, 'package.json'), JSON.stringify({ type: 'module' }));
    const setup = join(scratch, 'failure.ts');
    writeFileSync(
      setup,
      `
      import { execFileSync } from 'node:child_process';
      import { existsSync } from 'node:fs';
      export default function setup() {
        execFileSync('pnpm', ${JSON.stringify(['exec', 'playwright', 'test', '--config', config, '--list'])}, {
          cwd: ${JSON.stringify(root)}, stdio: 'pipe', timeout: 30000,
        });
        if (!existsSync(${JSON.stringify(lock)})) throw new Error('Discovery released its parent lock');
        throw new Error('Intentional setup failure');
      }
    `,
    );
    const probeConfig = join(scratch, 'playwright.config.ts');
    writeFileSync(
      probeConfig,
      `
      import config from ${JSON.stringify(config)};
      export default {
        ...config,
        testDir: ${JSON.stringify(join(root, 'e2e'))},
        outputDir: ${JSON.stringify(join(scratch, 'output'))},
        globalSetup: ${JSON.stringify(setup)},
      };
    `,
    );
    assert.throws(() => playwright(['--config', probeConfig]), /^(?:Error: )+Intentional setup failure$/m);
    assert.equal(existsSync(lock), false);
  } finally {
    rmSync(scratch, { recursive: true });
  }
});
