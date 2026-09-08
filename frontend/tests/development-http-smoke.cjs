/* eslint-disable @typescript-eslint/no-require-imports -- Read-only checks against the local running services. */
const assert = require('node:assert/strict');
const site = process.env.TEST_SITE_URL || 'http://localhost:3000';
const api = `${site}/api/backend/properties`;
async function json(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 200, url);
  return response.json();
}
async function main() {
  const demo = await json(`${api}/demo-beylikduzu-park`);
  const etro = await json(`${api}/etro-residences-istanbul`);
  assert.equal(demo.development.is_demo, true);
  assert.equal(demo.is_featured, false);
  assert.equal(demo.category_id, etro.category_id);
  assert.deepEqual(demo.unit_types.map(unit => unit.code), ['1+1', '2+1', '3+1', '4+1']);
  assert.equal(demo.price, 150000);
  const catalog = await json(`${api}/?category_id=${demo.category_id}&per_page=100`);
  assert.ok(catalog.items.some(item => item.id === demo.id));
  assert.ok(catalog.items.some(item => item.id === etro.id));
  const search = await json(`${api}/?search=${encodeURIComponent('Бейликдюзю')}&category_id=${demo.category_id}`);
  assert.ok(search.items.some(item => item.id === demo.id));
  for (const [query, includes] of [['rooms=2&max_area=75', false], ['rooms=2&min_area=95&max_area=100', true], ['rooms=4', true], ['rooms=4&min_area=1', false]]) {
    const filtered = await json(`${api}/?category_id=${demo.category_id}&${query}`);
    assert.equal(filtered.items.some(item => item.id === demo.id), includes, query);
  }
  assert.ok(!(await json(`${api}/featured`)).some(item => item.id === demo.id));
  console.log('API: both developments, category, district search, same-unit filters and demo exclusion from featured OK');
  for (const locale of ['ru', 'en', 'tr', 'ar']) {
    const response = await fetch(`${site}/${locale}/properties/${demo.slug}`, { signal: AbortSignal.timeout(60000) });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes('Beylikdüzü Park'), `${locale}: title`);
    assert.ok(/<h1[^>]*>Beylikdüzü Park/.test(html), `${locale}: rendered title, not only flight data`);
    assert.ok(/name="robots" content="noindex/.test(html), `${locale}: noindex`);
    assert.ok(html.includes('data-testid="sandbox-enquiry"'), `${locale}: disabled enquiries`);
    for (const id of ['concept', 'interiors', 'residences', 'location', 'residence-enquiry']) assert.ok(html.includes(`id="${id}"`), `${locale}: ${id}`);
    assert.ok(!html.includes('"@type":"ApartmentComplex"'), `${locale}: no fictional offer schema`);
    assert.ok(!html.includes('Application error:'), `${locale}: server error`);
    console.log(`HTTP: ${locale} demo page, sections, sandbox, noindex OK`);
  }
  const etroHtml = await (await fetch(`${site}/ru/properties/${etro.slug}`, { signal: AbortSignal.timeout(60000) })).text();
  assert.ok(etroHtml.includes('id="interiors"'));
  assert.ok(!etroHtml.includes('data-testid="sandbox-enquiry"'));
  assert.ok(!etroHtml.includes('id="etro-interior-1"'));
  assert.ok(etroHtml.includes('"@type":"ApartmentComplex"'));
  for (const image of [...demo.images, ...demo.development.interior_images, ...demo.unit_types.flatMap(unit => unit.plans)]) {
    const response = await fetch(`${site}${image}`);
    assert.equal(response.status, 200, image);
    assert.ok((await response.text()).includes('DEMO'), image);
  }
  const sitemap = await (await fetch(`${site}/sitemap.xml`, { signal: AbortSignal.timeout(60000) })).text();
  assert.ok(!sitemap.includes(demo.slug));
  console.log('HTTP: ETRO shared gallery, active real enquiry section, all demo assets and sitemap exclusion OK');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
