/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateSiteOrigin, getSiteOrigin } = require('./load-ts.cjs')('lib/site-config.ts');
test('production origin rejects missing scheme, local, placeholder and non-origin URLs', () => {
  for (const value of ['localhost', 'http://agency.com', 'https://localhost', 'https://127.0.0.1', 'https://example.com', 'https://agency.test', 'https://u:p@agency.com', 'https://agency.com/a', 'https://agency.com?x=1', 'https://agency.com#x']) {
    assert.throws(() => validateSiteOrigin(value, true), value);
  }
  assert.equal(validateSiteOrigin('https://agency.com/', true), 'https://agency.com');
});
test('one loaded module reads the current runtime origin, without build-time public variables', () => {
  const saved = { SITE_URL: process.env.SITE_URL, NODE_ENV: process.env.NODE_ENV, DEPLOYMENT_ENV: process.env.DEPLOYMENT_ENV };
  try {
    process.env.NODE_ENV = 'production'; delete process.env.DEPLOYMENT_ENV;
    delete process.env.SITE_URL; assert.throws(getSiteOrigin, /required/);
    process.env.SITE_URL = 'https://agency-one.com'; assert.equal(getSiteOrigin(), 'https://agency-one.com');
    process.env.SITE_URL = 'https://agency-two.com'; assert.equal(getSiteOrigin(), 'https://agency-two.com');
  } finally { for (const [k,v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } }
});
