/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {propertySchemaType,articleAuthor}=require('./load-ts.cjs')('lib/structured-data.ts');
test('schema type follows semantic data, never a translated slug',()=>{
 assert.equal(propertySchemaType({slug:'commercial'}),'Place');
 assert.equal(propertySchemaType({slug:'kvartira',schema_type:'Place'}),'Place');
 assert.equal(propertySchemaType({slug:'apartments-in-lisbon',schema_type:'Apartment'}),'Apartment');
});
test('authors are explicitly people or organizations with configured URLs',()=>{
 const author=articleAuthor({author:'Anna',author_type:'Person',author_url:'/team/anna'}, {}, 'https://agency.com');
 assert.deepEqual(author,{'@type':'Person',name:'Anna',url:'https://agency.com/team/anna'});
 assert.equal(articleAuthor({author:''},{},'https://agency.com'),undefined);
});
