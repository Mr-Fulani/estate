/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('./load-ts.cjs');
test('landing alternates include only complete active translations',()=>{
 const {landingLocales}=load('lib/landing-pages.ts');
 const page={translations:{ru:{title:'Title',description:'Intro',content:'Text'},en:{title:'Title',description:'Intro',content:'Text'},tr:{title:'Title',description:'',content:''}}};
 assert.deepEqual(landingLocales(page,['en','tr']),['en']);
});
test('authored content escapes HTML and rejects executable links',()=>{
 const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
 const {RichText}=load('components/content/RichText.tsx');
 const html=renderToStaticMarkup(React.createElement(RichText,{content:'## Local guide\n\n[Homes](/en/properties)\n\n<script>alert(1)</script>\n\n[Bad](javascript:alert)'}));
 assert.match(html,/<h2/);assert.match(html,/href="\/en\/properties"/);
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));
});
