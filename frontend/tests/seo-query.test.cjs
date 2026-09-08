/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {indexableQuery,privateQuery}=require('./load-ts.cjs')('lib/query-policy.ts');
test('tracking does not change indexability; search, filters and private links do',()=>{
 assert.equal(indexableQuery({utm_source:'google',gclid:'test',page:'2'}),true);
 for(const query of [{search:'home'},{category_id:'4'},{sort_by:'price'},{token:''},{preview:'1'}]) assert.equal(indexableQuery(query),false);
 assert.equal(privateQuery({token:['a','b']}),true);
});
