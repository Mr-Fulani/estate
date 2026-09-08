const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('./load-ts.cjs');
test('legal descriptions use localized CMS text and remain isolated between profiles', async()=>{
 for(const brand of ['Agency Alpha','Agency Beta']) {
  const settings={profile:{brand_name:brand,copy:{en:{'legal.privacy.intro':`${brand} data policy`}}}};
  const {staticPageMetadata}=load('lib/seo.ts',{'@/lib/api':{fetchSiteSettings:async()=>settings}});
  assert.equal((await staticPageMetadata('en','privacy')).description,`${brand} data policy`);
  assert.ok((await staticPageMetadata('en','terms')).description.includes(brand));
 }
});
