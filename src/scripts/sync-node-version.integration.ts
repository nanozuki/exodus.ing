import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./sync-node-version.ts', import.meta.url));

function run(t: TestContext, contents: string, mode: string) {
  const directory = mkdtempSync(join(tmpdir(), 'sync-node-version-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const dockerfile = join(directory, 'Dockerfile');
  writeFileSync(dockerfile, contents);
  const result = spawnSync(process.execPath, [script, mode], { cwd: directory, encoding: 'utf8' });

  return { ...result, contents: readFileSync(dockerfile, 'utf8') };
}

test('check rejects a stale image without modifying the Dockerfile', (t) => {
  const contents = 'FROM node:0.0.0-slim AS base\nRUN node --version\n';
  const result = run(t, contents, '--check');

  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes(`Dockerfile must use FROM node:${process.versions.node}-slim AS base.`));
  assert.equal(result.contents, contents);
});

test('write synchronizes the image and preserves the rest of the Dockerfile', (t) => {
  const result = run(t, 'FROM node:0.0.0-slim AS base\r\nRUN node --version\r\n', '--write');

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.contents, `FROM node:${process.versions.node}-slim AS base\r\nRUN node --version\r\n`);
});

test('check accepts the current runtime version', (t) => {
  const contents = `FROM node:${process.versions.node}-slim AS base\n`;
  const result = run(t, contents, '--check');

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.contents, contents);
});

test('write is idempotent', (t) => {
  const contents = `FROM node:${process.versions.node}-slim AS base\n`;
  const result = run(t, contents, '--write');

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.contents, contents);
});

for (const contents of [
  'FROM node:24-slim AS base\n',
  'FROM node:0.0.0-slim AS base\nFROM node:1.0.0-slim AS base\n',
]) {
  test(`write rejects an ambiguous or unsupported base image: ${JSON.stringify(contents)}`, (t) => {
    const result = run(t, contents, '--write');

    assert.equal(result.status, 1);
    assert.match(result.stderr, /exactly one/);
    assert.equal(result.contents, contents);
  });
}

test('an invalid mode fails without changing the Dockerfile', (t) => {
  const contents = 'FROM node:0.0.0-slim AS base\n';
  const result = run(t, contents, '--invalid');

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
  assert.equal(result.contents, contents);
});
