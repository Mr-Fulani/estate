/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('./load-ts.cjs');
const {getSiteCopy,applyCopy,brandInitials}=load('lib/site-profile.ts');
test('company identity and localized content are isolated between installations',async()=>{
  for(const name of ['Agency Alpha','Agency Beta']) {
    const settings={profile:{brand_name:name,seo:{en:{contact:{title:`Contact ${name}`,description:'Contact our team'}}},copy:{en:{'about.intro':`Welcome to ${name}`}}}};
    const copy=getSiteCopy('en',settings);
    assert.equal(copy.about.intro,`Welcome to ${name}`);
    assert.ok(copy.about.title.includes(name));
    assert.ok(!JSON.stringify(copy).includes('Rahat'));
    const {staticPageMetadata}=load('lib/seo.ts',{'@/lib/api':{fetchSiteSettings:async()=>settings}});
    const metadata=await staticPageMetadata('en','contact');
    assert.equal(metadata.title,`Contact ${name}`);
    assert.equal(metadata.openGraph.siteName,name);
    assert.deepEqual(metadata.openGraph.images,[]);
  }
  assert.equal(brandInitials({profile:{brand_name:'Agency Beta'}}),'AB');
});
test('text overrides cannot alter template structure or shared defaults',()=>{
 const template={a:{text:'Welcome {brand}'}};
 assert.deepEqual(applyCopy(template,{'a.text':'','__proto__.polluted':'yes'},'Beta'),{a:{text:''}});
 assert.equal(template.a.text,'Welcome {brand}');
 assert.equal({}.polluted,undefined);
});
