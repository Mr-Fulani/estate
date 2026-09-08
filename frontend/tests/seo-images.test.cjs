const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');

test('photo descriptions follow the requested language and preserve decorative empty alt', () => {
  const { imageText } = load('lib/image-text.ts');
  const details = {'/photo.jpg': {en: {alt: 'Meeting room', caption: 'Second floor'}, tr: {decorative: true}}};
  assert.deepEqual(imageText(details, '/photo.jpg', 'en', 'Office'), {alt: 'Meeting room', caption: 'Second floor'});
  assert.equal(imageText(details, '/photo.jpg', 'tr', 'Office').alt, '');
  assert.deepEqual(imageText(details, '/photo.jpg', 'ar', 'Office'), {alt: 'Office', caption: ''});
});
