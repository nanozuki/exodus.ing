// sync-node-version.ts keeps the Dockerfile's `FROM node:<version>-slim AS base` image at the running Node version.
// Run it from the repository root inside `nix develop` so the locked development runtime supplies that version;
// Renovate runs `--write` after lock file maintenance. `--write` rewrites only that line; `--check` changes nothing and
// fails on a mismatch. Invalid arguments and a missing or repeated base image fail in both modes. It uses only Node
// built-ins, so it needs no installed dependencies.

import { readFileSync, writeFileSync } from 'node:fs';

const mode = process.argv[2];

if (process.argv.length !== 3 || !['--check', '--write'].includes(mode)) {
  console.error('Usage: nix develop --command node src/scripts/sync-node-version.ts --check|--write');
  process.exit(1);
}

const dockerfile = readFileSync('Dockerfile', 'utf8');
const baseImage = /^FROM node:\d+\.\d+\.\d+-slim AS base(?=\r?$)/gm;

if ([...dockerfile.matchAll(baseImage)].length !== 1) {
  console.error('Expected exactly one FROM node:<major>.<minor>.<patch>-slim AS base in Dockerfile.');
  process.exit(1);
}

const expectedImage = `FROM node:${process.versions.node}-slim AS base`;
const synchronized = dockerfile.replace(baseImage, expectedImage);

if (mode === '--check' && synchronized !== dockerfile) {
  console.error(`Dockerfile must use ${expectedImage}. Run this script with --write inside nix develop.`);
  process.exit(1);
}

if (mode === '--write' && synchronized !== dockerfile) {
  writeFileSync('Dockerfile', synchronized);
}
