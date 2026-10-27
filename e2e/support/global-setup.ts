import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import type { FullConfig } from '@playwright/test';
import { databaseSuffix } from './names';

type ListedSuite = { specs?: { title: string }[]; suites?: ListedSuite[] };

function checkNames(suites: ListedSuite[], names = new Map<string, string>()): void {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      const database = `exodus-${databaseSuffix(spec.title)}`;
      const previous = names.get(database);
      if (previous) throw new Error(`Database slug collision: "${previous}" and "${spec.title}" both use ${database}`);
      names.set(database, spec.title);
    }
    checkNames(suite.suites ?? [], names);
  }
}

/** Check database-name uniqueness and build the deployment entry point once under the configuration's lock. */
export default async function globalSetup(config: FullConfig): Promise<void> {
  // List mode discovers names without running global setup or touching any databases.
  const { stdout } = await promisify(execFile)('pnpm', [
    'exec',
    'playwright',
    'test',
    '--config',
    config.configFile!,
    '--list',
    '--reporter=json',
  ]);
  checkNames((JSON.parse(stdout) as { suites: ListedSuite[] }).suites);
  await new Promise<void>((resolve, reject) => {
    const build = spawn('pnpm', ['build'], { stdio: 'inherit' });
    build.once('error', reject);
    build.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Application build failed (${signal ?? code})`));
    });
  });
}
