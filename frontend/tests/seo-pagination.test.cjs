/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {paginationPage,assertPageExists}=require('./load-ts.cjs')('lib/pagination.ts',{
  'next/navigation':{notFound:()=>{throw new Error('404');}},
});
test('pagination rejects malformed and repeated values consistently',()=>{
  for(const value of ['0','-1','1.5','Infinity','NaN','','01','1x',' 2','1e2','9007199254740992',['1','2']]) assert.throws(()=>paginationPage(value),/404/);
  assert.equal(paginationPage(undefined),1);
  assert.equal(paginationPage('2'),2);
});
test('an empty first page exists, pages beyond the final page do not',()=>{
  assert.doesNotThrow(()=>assertPageExists(1,0,12));
  assert.doesNotThrow(()=>assertPageExists(2,13,12));
  assert.throws(()=>assertPageExists(3,13,12),/404/);
  assert.throws(()=>assertPageExists(2,0,12),/404/);
});
