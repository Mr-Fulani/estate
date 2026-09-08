/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');
test('sitemap keeps the same ordering beyond 100 properties and includes each URL once', async () => {
  const all = Array.from({length: 101}, (_, i) => ({id:i+1, slug:`property-${i+1}`, translations:[{locale:'ru',title:'Property',description:'Description'}]}));
  const calls=[];
  const { default:sitemap } = load('app/sitemap.ts', {
    '@/lib/site-config': {getSiteOrigin:()=> 'https://agency.com'},
    '@/lib/api': {
      fetchProperties:async params => {
        calls.push(params);
        const ordered=params.sort_by==='updated_at'? all:[...all].reverse();
        return {items:ordered.slice((params.page-1)*100,params.page*100),total:101,per_page:100};
      },
      fetchNews:async()=>({items:[],total:0,per_page:50}),
    },
  });
  const result=(await sitemap()).filter(entry=>entry.url.includes('/properties/property-'));
  assert.equal(result.length,101);
  assert.equal(new Set(result.map(entry=>entry.url)).size,101);
  assert.ok(result.some(entry=>entry.url.endsWith('/property-101')));
  assert.deepEqual(calls.map(({sort_by,order})=>({sort_by,order})),Array(2).fill({sort_by:'updated_at',order:'desc'}));
});
