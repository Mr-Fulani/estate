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
const { emptyDevelopment, preparePropertyForm, buildDevelopmentPreview, developmentSections, isMediaUrl, developmentUnitPath, developmentUnitMatchesPath } = target.exports;
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
test('unit detail routes have stable encoded paths and match source layout codes', () => {
  const path = developmentUnitPath('6+1 Duplex');
  assert.equal(path, '6%2B1-duplex');
  assert.equal(developmentUnitMatchesPath('6+1 Duplex', '6+1-duplex'), true);
  assert.equal(developmentUnitMatchesPath('1+1', '1%2B1'), true);
  assert.equal(developmentUnitMatchesPath('7+1 Simplex', '6+1-duplex'), false);
});
test('video embeds accept supported providers and direct web video files', () => {
  const videoPath = resolve(__dirname, '../src/lib/video-media.ts');
  const videoModule = new Module(videoPath, module);
  videoModule._compile(ts.transpileModule(readFileSync(videoPath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, videoPath);
  const { videoEmbedUrl, isDirectVideoUrl } = videoModule.exports;
  assert.equal(videoEmbedUrl('https://drive.google.com/file/d/media-id/view'), 'https://drive.google.com/file/d/media-id/preview');
  assert.equal(videoEmbedUrl('https://youtu.be/abcdefghijk'), 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  assert.equal(videoEmbedUrl('https://vimeo.com/123456'), 'https://player.vimeo.com/video/123456');
  assert.equal(videoEmbedUrl('http://youtube.com/watch?v=abcdefghijk'), null);
  assert.equal(isDirectVideoUrl('https://cdn.example.com/villa.webm'), true);
});
test('shared project page has one global navigation and no local contact form', () => {
  const source = readFileSync(resolve(__dirname, '../src/components/properties/DevelopmentPage.tsx'), 'utf8');
  assert.ok(!source.includes('DevelopmentExperience'));
  assert.ok(!source.includes('etro-residences-istanbul'));
  assert.ok(!source.includes('sectionNav'));
  assert.ok(!source.includes('navItems.filter(([visible]) => visible)'));
  assert.ok(!source.includes('PropertyContactActions'));
  assert.ok(!source.includes('<ContactForm'));
  assert.ok(source.includes('heroMediaControls'));
  assert.ok(source.includes('heroVideos'));
  assert.ok(source.includes('className={styles.unitCards}'));
  assert.ok(source.includes('item.video_url'));
  assert.ok(source.includes('developmentUnitPath(item.code)'));
  const route = readFileSync(resolve(__dirname, '../src/components/pages/PropertyDetailContent.tsx'), 'utf8');
  assert.match(route, /return\s*<>\s*<script[^]*?<DevelopmentPage/);
  assert.ok(!route.includes('pt-6">{breadcrumbs}'));
  const unitDetail = readFileSync(resolve(__dirname, '../src/components/properties/DevelopmentUnitDetailPage.tsx'), 'utf8');
  assert.ok(unitDetail.includes('PropertyGallery'));
  assert.ok(unitDetail.includes('unit.plans'));
  const pageRoute = readFileSync(resolve(__dirname, '../src/app/[locale]/properties/[id]/[unit]/page.tsx'), 'utf8');
  assert.ok(pageRoute.includes('alternates: { canonical: canonicalPath, languages }'));
});
