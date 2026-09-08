const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');

test('campaign survives SPA navigation; new campaign updates only last touch', () => {
  const { nextTouchState, attributionUrl } = load('lib/attribution.ts');
  const now = Date.parse('2026-09-08T12:00:00Z');
  const first = nextTouchState(undefined, 'https://agency-one.test/en?utm_source=search&utm_campaign=homes&token=secret', 'https://search.test/?q=private', now, true, 7);
  const internal = nextTouchState(first, 'https://agency-one.test/en/properties/home', 'https://search.test/?q=private', now+1000, false, 7);
  assert.deepEqual(internal.first, first.first);
  assert.deepEqual(internal.last, first.last);
  assert.equal(internal.last.referrer, 'https://search.test/');
  assert.equal(internal.last.page_url, 'https://agency-one.test/en');
  const second = nextTouchState(internal, 'https://agency-one.test/en?utm_source=email', '', now+2000, false, 7);
  assert.deepEqual(second.first, first.first);
  assert.equal(second.last.utm_source, 'email');
  assert.equal(second.last.utm_campaign, undefined);
  assert.equal(attributionUrl('https://agency-one.test/en?preview=secret#token'), 'https://agency-one.test/en');
});

test('attribution expires and cannot carry another deployment origin', () => {
  const { nextTouchState } = load('lib/attribution.ts');
  const previous = nextTouchState(undefined, 'https://agency-one.test/en?utm_source=old', '', 1000, true, 1);
  const changed = nextTouchState(previous, 'https://agency-two.test/en', '', 2000, true, 1);
  assert.equal(changed.first.utm_source, undefined);
  const expired = nextTouchState(previous, 'https://agency-one.test/en', '', previous.expires+1, true, 1);
  assert.equal(expired.first.utm_source, undefined);
});

test('forms remain usable when browser storage is blocked and tracking can be disabled', () => {
  const { collectContactAttribution, configureAttribution } = load('lib/attribution.ts');
  global.window = {location: new URL('https://agency.test/en?utm_source=search&token=secret')};
  Object.defineProperty(window, 'sessionStorage', {get: () => {throw new Error('Blocked');}});
  global.document = {referrer: ''};
  try {
    const data = collectContactAttribution('en', 'form');
    assert.equal(data.utm_source, 'search');
    assert.ok(data.first_touch);
    assert.ok(!JSON.stringify(data).includes('secret'));
    configureAttribution({enabled:false});
    assert.deepEqual(collectContactAttribution('en','form'), {locale:'en',source:'form',property_id:undefined});
  } finally {delete global.window; delete global.document;}
});
