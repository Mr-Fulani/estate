/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fetchSiteSettings, fallbackSiteSettings } = require('./load-ts.cjs')('lib/api.ts');
test('settings outage is an error, never substituted contacts', async () => {
  const original = global.fetch;
  try {
    global.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(fetchSiteSettings, /temporarily unavailable/);
    global.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(fetchSiteSettings, /offline/);
  } finally { global.fetch = original; }
  assert.equal(fallbackSiteSettings.phone, '');
  assert.equal(fallbackSiteSettings.email, '');
  assert.equal(fallbackSiteSettings.telegram, undefined);
});
