// Run from the repository root through nix develop so this process uses the
// locked development runtime. --check leaves files unchanged; --write updates
// the single Node base image and rejects an unexpected Dockerfile layout.

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
