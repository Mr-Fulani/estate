/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {indexingEnabled,readyForIndexing,previewResponse}=require('./load-ts.cjs')('lib/indexing.ts');
test('indexing requires production opt-in and a reviewed company profile',()=>{
 const keys=['INDEXING_ENABLED','DEPLOYMENT_ENV','SITE_URL','PREVIEW_USERNAME','PREVIEW_PASSWORD','SITE_LOCALES','SITE_DEFAULT_LOCALE'];
 const saved=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 try {
  process.env.SITE_URL='https://agency.com';process.env.DEPLOYMENT_ENV='production';delete process.env.INDEXING_ENABLED;
  assert.equal(indexingEnabled(),false);
  process.env.INDEXING_ENABLED='true';assert.equal(indexingEnabled(),true);
  assert.equal(readyForIndexing({phone:'',profile:{brand_name:'Agency'}}),false);
  const settings={phone:'+10000000',profile:{brand_name:'Agency',content_reviewed:true,seo:{ru:{home:{title:'Agency',description:'Property services'}}}}};
  for (const [locales, defaultLocale] of [['ru,en','ru'],['en,tr','en']]) {
   process.env.SITE_LOCALES=locales;process.env.SITE_DEFAULT_LOCALE=defaultLocale;
   const configured={...settings,profile:{...settings.profile,seo:{[defaultLocale]:settings.profile.seo.ru}}};
   assert.equal(readyForIndexing(configured),true);
   assert.equal(readyForIndexing({...configured,profile:{...configured.profile,seo:{}}}),false);
  }
  process.env.DEPLOYMENT_ENV='preview';assert.equal(indexingEnabled(),false);
  delete process.env.PREVIEW_USERNAME;delete process.env.PREVIEW_PASSWORD;
  assert.equal(previewResponse(new Request('https://agency.com')).status,503);
  process.env.PREVIEW_USERNAME='reviewer';process.env.PREVIEW_PASSWORD='isolated-test-password';
  assert.equal(previewResponse(new Request('https://agency.com')).status,401);
  const request=new Request('https://agency.com',{headers:{authorization:`Basic ${Buffer.from('reviewer:isolated-test-password').toString('base64')}`}});
  assert.equal(previewResponse(request),null);
 } finally {for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
