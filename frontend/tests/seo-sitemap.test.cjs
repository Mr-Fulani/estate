/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {buildSitemapEntries,sitemapParts,createSitemapCache}=require('./load-ts.cjs')('lib/sitemap-data.ts');
test('101 resources produce the exact URL set without duplicates',()=>{
 const items=Array.from({length:101},(_,i)=>({path:`/properties/property-${i+1}`,locales:['en','tr']}));
 const entries=buildSitemapEntries('https://agency.com',['en','tr'],'en',items).filter(item=>item.url.includes('/properties/property-'));
 assert.equal(entries.length,202);assert.equal(new Set(entries.map(item=>item.url)).size,202);
 assert.ok(entries.some(item=>item.url.endsWith('/property-101')));
 assert.equal(entries[0].languages['x-default'],'https://agency.com/en/properties/property-1');
});
test('large maps split below URL and byte limits and escape XML',()=>{
 const entries=buildSitemapEntries('https://agency.com',['en'],'en',[{path:'/properties/a&b',locales:['en']}]);
 const parts=sitemapParts(entries,3);
 assert.equal(parts.length,4);
 assert.ok(parts.every(part=>(part.match(/<url>/g)||[]).length<=3));
 assert.match(parts.join(''),/a&amp;b/);
});
test('source failure never produces a successful partial map or crosses origins',async()=>{
 let now=0;let calls=0;
 const cache=createSitemapCache(()=>now,10,100);
 const loader=async()=>{calls++;return ['all URLs'];};
 assert.deepEqual(await cache('A',loader),{value:['all URLs'],stale:false});
 await cache('A',loader);assert.equal(calls,1);
 now=20;
 const fail=async()=>{throw new Error('offline');};
 assert.deepEqual(await cache('A',fail),{value:['all URLs'],stale:true});
 await assert.rejects(()=>cache('B',fail),/offline/);
 now=101;await assert.rejects(()=>cache('A',fail),/offline/);
});
