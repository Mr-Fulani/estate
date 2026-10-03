const { test } = require('node:test');
const assert = require('node:assert/strict');
const { unitSeoDescription, propertyVideoSchema } = require('./load-ts.cjs')('lib/property-seo.ts');

test('unit snippets distinguish layouts before long project text, in every language', () => {
  const property = { title: 'Kılıç Life — Maslak', city: 'Istanbul', district: 'Sarıyer' };
  const unit = { code: '1+1', area_min: 70, area_max: 90 };
  for (const locale of ['ru', 'en', 'tr', 'ar']) {
    const first = unitSeoDescription(property, unit, locale);
    const second = unitSeoDescription(property, { ...unit, code: '2+1' }, locale);
    assert.notEqual(first, second);
    assert.ok(first.indexOf('1+1') < first.indexOf(property.title));
    assert.ok(first.includes('m²'));
    assert.ok(!unitSeoDescription(property, { ...unit, area_min: null, area_max: null }, locale).includes('m²'));
  }
});

test('video schema uses real local previews, deduplicates files and invents no dates', () => {
  const url = `/media/properties/optimized/${'a'.repeat(64)}.mp4`;
  const data = propertyVideoSchema([url, url, 'https://youtu.be/example'], 'Project', 'en', 'https://agency.com/en/project', 'https://agency.com');
  assert.equal(data.length, 1);
  assert.equal(data[0]['@type'], 'VideoObject');
  assert.equal(data[0].thumbnailUrl, `https://agency.com${url.replace('.mp4', '.poster.webp')}`);
  assert.equal(data[0].contentUrl, `https://agency.com${url}`);
  assert.equal(data[0].uploadDate, undefined);
});
