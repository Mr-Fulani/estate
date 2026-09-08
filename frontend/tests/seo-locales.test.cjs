/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {localizedProperty,localizedPropertyTranslation,propertyAvailableLocales,hasPropertyLocale}=require('./load-ts.cjs')('i18n/domain.ts');
test('partial translations never produce an indexable mixed title and description',()=>{
 const property={title:'Исходный заголовок',description:'Исходное описание',translations:[
  {locale:'en',title:'Title',description:null},
  {locale:'tr',title:'Başlık',description:'Açıklama'},
 ]};
 assert.equal(hasPropertyLocale(property,'en'),false);
 assert.deepEqual(propertyAvailableLocales(property).sort(),['ru','tr']);
 assert.equal(localizedProperty(property,'en').title,property.title);
 assert.equal(localizedPropertyTranslation(property,'en').locale,'ru');
 assert.equal(localizedProperty(property,'tr').description,'Açıklama');
});
