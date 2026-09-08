/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('./load-ts.cjs');
const {getLocaleConfig,defaultAvailableLocale}=load('lib/runtime-locales.ts');
test('an EN/TR project does not publish Russian alternates or require a Russian default',()=>{
 const saved={SITE_LOCALES:process.env.SITE_LOCALES,SITE_DEFAULT_LOCALE:process.env.SITE_DEFAULT_LOCALE};
 try{
  process.env.SITE_LOCALES='en,tr';process.env.SITE_DEFAULT_LOCALE='en';
  assert.deepEqual(getLocaleConfig(),{locales:['en','tr'],defaultLocale:'en'});
  assert.equal(defaultAvailableLocale(['tr']),'tr');
  const {localizedAlternates}=load('lib/seo.ts',{'@/lib/api':{}});
  assert.deepEqual(localizedAlternates('/about'),{en:'/en/about',tr:'/tr/about','x-default':'/en/about'});
  process.env.SITE_DEFAULT_LOCALE='ru';assert.throws(getLocaleConfig,/SITE_LOCALES/);
 }finally{for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test('unknown currency and missing conversion rates are explicit errors',()=>{
 const {normalizeCurrencyCode,convertCurrency}=load('lib/currency.ts');
 assert.throws(()=>normalizeCurrencyCode('AED'),/Unsupported/);
 assert.throws(()=>convertCurrency(100,'EUR','USD'),/unavailable/);
 assert.equal(convertCurrency(100,'EUR','USD',{EUR:90,USD:75}),120);
});
