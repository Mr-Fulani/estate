/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for Node 20 and temporary compiler output. */
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

// Compile only the browser-independent test targets. Do not change Next's live build directory.
const output = mkdtempSync(join(tmpdir(), 'estate-scroll-tests-'));
const result = spawnSync(process.execPath, [
  require.resolve('typescript/bin/tsc'),
  'src/lib/scroll-frames.ts', 'src/lib/ScrollFramePlayer.ts', 'src/lib/interior-timeline.ts',
  '--outDir', output, '--target', 'es2020', '--module', 'commonjs', '--skipLibCheck',
], { cwd: resolve(__dirname, '..'), stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
const tests = spawnSync(process.execPath, ['--test', 'tests/scroll-frames.test.cjs', 'tests/interior-timeline.test.cjs'], {
  cwd: resolve(__dirname, '..'), env: { ...process.env, SCROLL_TEST_MODULE_DIR: output }, stdio: 'inherit',
});
process.exit(tests.status || 0);
