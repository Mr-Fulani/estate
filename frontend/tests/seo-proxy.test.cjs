/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {proxy}=require('./load-ts.cjs')('proxy.ts',{
 'next/server':{NextResponse:{next:()=>({headers:new Headers(),status:200}),redirect:()=>({status:308,headers:new Headers()})}},
});
function request(path) {
 const url=new URL(path,'https://agency.com');
 url.clone=()=>new URL(url);
 return {nextUrl:url,headers:new Headers(),cookies:{get:()=>undefined}};
}
test('private invitation URLs disable indexing, cache and referrer disclosure',async()=>{
 const response=await proxy(request('/en/reviews?token=private'));
 assert.equal(response.headers.get('X-Robots-Tag'),'noindex, follow');
 assert.match(response.headers.get('Cache-Control'),/private, no-store/);
 assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
});
