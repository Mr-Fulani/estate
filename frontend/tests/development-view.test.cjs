/* eslint-disable @typescript-eslint/no-require-imports -- Node 20 test runner; only type imports are erased. */
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = resolve(__dirname, '../src/lib/development-view.ts');
const target = new Module(path, module);
target._compile(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, path);
const { emptyDevelopment, preparePropertyForm, buildDevelopmentPreview, developmentSections, isMediaUrl } = target.exports;
const unit = (code = '1+1', price = 100) => ({ code, rooms: 1, area_min: 50, area_max: 60, price_min: price, price_max: price + 10, position: 9, plans: ['/plan.svg'], plan_details: [{ image: '/plan.svg', code: 'A1', area_gross: 50, area_net: 40, area_with_balcony: 45 }] });
const draft = (more = {}) => ({ title: 'New complex', price: 999, category_id: 6, city: '', listing_kind: 'development', development: { ...emptyDevelopment }, unit_types: [unit()], ...more });

test('preview derives price and area from current unsaved units without mutating form data', () => {
  const data = draft({ unit_types: [unit('2+1', 200), unit('1+1', 80)] });
  const before = JSON.stringify(data);
  const preview = buildDevelopmentPreview(data, []);
  assert.equal(preview.price, 80);
  assert.equal(preview.area, 50);
  assert.equal(preview.id, 0);
  assert.equal(preview.is_active, false);
  assert.equal(JSON.stringify(data), before);
});
test('unknown ranges remain unknown, not invented', () => {
  const data = draft({ unit_types: [{ ...unit('4+1'), area_min: null, area_max: null, price_min: null, price_max: null }] });
  assert.equal(buildDevelopmentPreview(data, []).unit_types[0].area_min, null);
  assert.equal(buildDevelopmentPreview(data, []).price, 0);
});
test('empty sections disappear; exterior photos do not become interior photos', () => {
  const preview = buildDevelopmentPreview(draft({ images: ['/cover.svg'], unit_types: [] }), []);
  const sections = developmentSections(preview, 'ru');
  assert.equal(sections.concept, false);
  assert.equal(sections.residences, false);
  assert.equal(sections.location, false);
  assert.deepEqual(sections.interiors, []);
  assert.deepEqual(sections.amenities, []);
});
test('editorial locale fallback, whitespace, sections and media match shared payload', () => {
  const data = draft({ development: { ...emptyDevelopment, interior_images: [' /room.svg ', ' '], translations: { en: { story: 'An interior story', amenities: [' Park ', ' '] } } } });
  const preview = buildDevelopmentPreview(data, []);
  const sections = developmentSections(preview, 'ar');
  assert.equal(sections.concept, true);
  assert.equal(sections.editorial.story, 'An interior story');
  assert.deepEqual(sections.amenities, ['Park']);
  assert.deepEqual(sections.interiors, ['/room.svg']);
});
test('save and preview clean plans, preserve plan identities and enforce demo non-featured state', () => {
  const data = draft({ is_featured: true, development: { ...emptyDevelopment, is_demo: true }, unit_types: [{ ...unit(' 1+1 '), plans: [' /plan.svg ', ' '], plan_details: [...unit().plan_details, { image: '/gone.svg', code: 'old' }] }] });
  const payload = preparePropertyForm(data);
  assert.equal(payload.is_featured, false);
  assert.equal(payload.unit_types[0].code, '1+1');
  assert.equal(payload.unit_types[0].position, 0);
  assert.deepEqual(payload.unit_types[0].plan_details, unit().plan_details);
});
test('preview tolerates an incomplete draft and rejects unsafe media sources', () => {
  for (const url of ['javascript:alert(1)', '//example.com/a.svg', 'http://example.com/a.svg', '/\\example.com/a.svg', 'https://', '/\n/example.com/a.svg']) assert.equal(isMediaUrl(url), false);
  const preview = buildDevelopmentPreview(draft({ title: '', unit_types: [], images: ['javascript:alert(1)', '/safe.svg'], development: { ...emptyDevelopment, price_date: 'not-a-date' } }), []);
  assert.equal(preview.title, 'Новый жилой комплекс');
  assert.equal(preview.development.price_date, null);
  assert.deepEqual(preview.images, ['/safe.svg']);
});
test('shared page is not selected by slug and sandbox never mounts real contact actions', () => {
  const source = readFileSync(resolve(__dirname, '../src/components/properties/DevelopmentPage.tsx'), 'utf8');
  assert.ok(!source.includes('DevelopmentExperience'));
  assert.ok(!source.includes('etro-residences-istanbul'));
  assert.ok(source.includes('navItems.filter(([visible]) => visible)'));
  assert.ok(source.includes('!sandboxed && <PropertyContactActions'));
  assert.ok(source.includes('sandboxed ? <div'));
});
