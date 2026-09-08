/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {indexingEnabled,readyForIndexing,previewResponse}=require('./load-ts.cjs')('lib/indexing.ts');
test('indexing requires production opt-in and a reviewed company profile',()=>{
 const keys=['INDEXING_ENABLED','DEPLOYMENT_ENV','SITE_URL','PREVIEW_USERNAME','PREVIEW_PASSWORD'];
 const saved=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 try {
  process.env.SITE_URL='https://agency.com';process.env.DEPLOYMENT_ENV='production';delete process.env.INDEXING_ENABLED;
  assert.equal(indexingEnabled(),false);
  process.env.INDEXING_ENABLED='true';assert.equal(indexingEnabled(),true);
  assert.equal(readyForIndexing({phone:'',profile:{brand_name:'Agency'}}),false);
  const settings={phone:'+10000000',profile:{brand_name:'Agency',content_reviewed:true,seo:{ru:{home:{title:'Agency',description:'Property services'}}}}};
  assert.equal(readyForIndexing(settings),true);
  process.env.DEPLOYMENT_ENV='preview';assert.equal(indexingEnabled(),false);
  delete process.env.PREVIEW_USERNAME;delete process.env.PREVIEW_PASSWORD;
  assert.equal(previewResponse(new Request('https://agency.com')).status,503);
  process.env.PREVIEW_USERNAME='reviewer';process.env.PREVIEW_PASSWORD='isolated-test-password';
  assert.equal(previewResponse(new Request('https://agency.com')).status,401);
  const request=new Request('https://agency.com',{headers:{authorization:`Basic ${Buffer.from('reviewer:isolated-test-password').toString('base64')}`}});
  assert.equal(previewResponse(request),null);
 } finally {for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
