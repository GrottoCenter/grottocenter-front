import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import serviceWorkerBuildGuard from './serviceWorkerBuildGuard.mjs';

describe('serviceWorkerBuildGuard', () => {
  let root;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'grottocenter-sw-'));
    await mkdir(join(root, 'dist'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const runGuard = async source => {
    const guard = serviceWorkerBuildGuard();
    guard.configResolved({ root, build: { outDir: 'dist' } });
    await writeFile(join(root, 'dist', 'sw.js'), source);
    return guard.closeBundle.handler();
  };

  it('accepts explicit service-worker platform globals', async () => {
    await expect(
      runGuard('new globalThis.URL(request.url); new globalThis.Response();')
    ).resolves.toBeUndefined();
  });

  it('rejects platform globals renamed by config bundling', async () => {
    await expect(runGuard('new URL$1(request.url);')).rejects.toThrow('URL$1');
  });
});
