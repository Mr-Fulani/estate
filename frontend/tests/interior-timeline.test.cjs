/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { readFileSync } = require('node:fs');
const { sceneOffset } = require(join(process.env.SCROLL_TEST_MODULE_DIR, 'interior-timeline.js'));

test('background offset centers when the section centers in the viewport', () => {
  assert.equal(sceneOffset(100, 600, 800), 0);
});
test('parallax remains inside image overscan at both edges', () => {
  assert.equal(sceneOffset(1000, 600, 800), -36);
  assert.equal(sceneOffset(-1000, 600, 800), 36);
  for (let top = -2000; top <= 2000; top += 10) assert.ok(Math.abs(sceneOffset(top, 600, 800)) <= 36);
});
test('forward and backward scrolling follow geometry without timeline state', () => {
  const forward = [800, 400, 0, -400, -800].map(top => sceneOffset(top, 600, 800));
  const backward = [-800, -400, 0, 400, 800].map(top => sceneOffset(top, 600, 800));
  assert.deepEqual(forward, backward.reverse());
  assert.ok(forward.every((offset, index) => index === 0 || offset >= forward[index - 1]));
});
test('invalid or collapsed geometry has no movement', () => {
  assert.equal(sceneOffset(0, 0, 800), 0);
  assert.equal(sceneOffset(0, 600, 0), 0);
});
test('interiors are separate sections, not pinned or hidden slideshow layers', () => {
  const component = readFileSync(join(__dirname, '../src/components/properties/DevelopmentExperience.tsx'), 'utf8');
  const css = readFileSync(join(__dirname, '../src/components/properties/DevelopmentExperience.module.css'), 'utf8');
  assert.match(component, /images\.map\([\s\S]*?<section[\s\S]*?data-interior-scene/);
  assert.doesNotMatch(css, /position\s*:\s*(?:sticky|fixed)|opacity\s*:\s*0|1500px/);
});
test('homepage retains original sticky hero and foreground content without a tall clip', () => {
  const hero = readFileSync(join(__dirname, '../src/components/home/Hero.tsx'), 'utf8');
  const page = readFileSync(join(__dirname, '../src/components/pages/HomePageContent.tsx'), 'utf8');
  assert.match(hero, /sticky top-0 z-0/);
  assert.match(hero, /min-h-\[100svh\]/);
  assert.match(page, /isolate -mt-16/);
  assert.match(page, /data-testid="home-content" className="relative z-10"/);
  assert.doesNotMatch(page, /overflow-clip|ResidenceExperience/);
});
