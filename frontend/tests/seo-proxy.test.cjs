/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {proxy}=require('./load-ts.cjs')('proxy.ts',{
 'next/server':{NextResponse:{next:()=>({headers:new Headers(),status:200}),redirect:()=>({status:308,headers:new Headers()}),rewrite:url=>({status:200,headers:new Headers(),destination:url.toString()})}},
});
function request(path) {
 const url=new URL(path,'https://agency.com');
 url.clone=()=>new URL(url);
 return {nextUrl:url,headers:new Headers(),cookies:{get:()=>undefined}};
}
test('dynamic icons keep their original URL including Next cache query',async()=>{
 for (const path of ['/icon?abc=1','/apple-icon?abc=1']) assert.equal((await proxy(request(path))).status,200);
});
test('private invitation URLs disable indexing, cache and referrer disclosure',async()=>{
 const response=await proxy(request('/en/reviews?token=private'));
 assert.equal(response.headers.get('X-Robots-Tag'),'noindex, follow');
 assert.match(response.headers.get('Cache-Control'),/private, no-store/);
 assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
});

test('browser API and uploads follow the runtime upstream without rebuilding', async()=>{
 const previous=process.env.INTERNAL_API_URL;
 try {
  for(const host of ['api-one:8000','api-two:8080']) {
   process.env.INTERNAL_API_URL=`http://${host}/api/v1`;
   assert.equal((await proxy(request('/api/backend/properties?page=2'))).destination,`http://${host}/api/v1/properties?page=2`);
   assert.equal((await proxy(request('/uploads/photo.webp'))).destination,`http://${host}/uploads/photo.webp`);
  }
 } finally {if(previous===undefined)delete process.env.INTERNAL_API_URL;else process.env.INTERNAL_API_URL=previous;}
});
