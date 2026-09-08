/* eslint-disable @typescript-eslint/no-require-imports -- These Node tests load compiled CommonJS modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { FRAME_COUNT, frameAt, frameQueue, nearestFrame, scrollProgress, frameURL } = require(join(process.env.SCROLL_TEST_MODULE_DIR, 'scroll-frames.js'));
const { ScrollFramePlayer } = require(join(process.env.SCROLL_TEST_MODULE_DIR, 'ScrollFramePlayer.js'));

test('scroll travel respects the fixed header and clamps both ends', () => {
  assert.equal(scrollProgress(800, 2080, 800, 96), 0);
  assert.equal(scrollProgress(96, 2080, 800, 96), 0);
  assert.equal(scrollProgress(-592, 2080, 800, 96), .5);
  assert.equal(scrollProgress(-1280, 2080, 800, 96), 1);
  assert.equal(scrollProgress(-5000, 2080, 800, 96), 1);
  assert.equal(scrollProgress(0, 500, 800, 96), 0);
});

test('both endpoints and nearest loaded fallback are reachable', () => {
  assert.equal(frameAt(-1), 0);
  assert.equal(frameAt(1), FRAME_COUNT - 1);
  assert.equal(frameAt(2), FRAME_COUNT - 1);
  assert.equal(nearestFrame(90, [0, 24, 72, 96]), 96);
  assert.equal(nearestFrame(90, []), null);
});

test('queues cover the whole timeline but stay bounded on both screen sizes', () => {
  for (const mobile of [true, false]) {
    for (let target = 0; target < FRAME_COUNT; target++) {
      const queue = frameQueue(target, mobile);
      assert.equal(queue[0], target);
      assert.ok(queue.includes(0) && queue.includes(143));
      assert.ok(queue.length <= 25);
      assert.equal(new Set(queue).size, queue.length);
      assert.ok(queue.every(frame => frame >= 0 && frame < FRAME_COUNT));
    }
  }
});

test('frame URLs use the correct asset tier', () => {
  assert.equal(frameURL(7, true), '/residences/etro/scroll-v1/mobile/frame-007.webp');
  assert.equal(frameURL(143, false), '/residences/etro/scroll-v1/desktop/frame-143.webp');
});

function fixture() {
  const originals = {};
  const replace = (key, value) => { originals[key] = global[key]; global[key] = value; };
  const rafs = new Map();
  const requests = [];
  let id = 0;
  let errors = 0;
  let ready = 0;
  const windowMock = Object.assign(new EventTarget(), { innerHeight: 800, devicePixelRatio: 1 });
  const documentMock = Object.assign(new EventTarget(), { hidden: false });
  replace('window', windowMock);
  replace('document', documentMock);
  replace('requestAnimationFrame', callback => { rafs.set(++id, callback); return id; });
  replace('cancelAnimationFrame', frame => rafs.delete(frame));
  replace('getComputedStyle', () => ({ getPropertyValue: () => '96px' }));
  replace('ResizeObserver', class { observe() {} disconnect() {} });
  replace('Image', class {
    naturalWidth = 540;
    naturalHeight = 960;
    onload = null;
    onerror = null;
    set src(value) { this.url = value; requests.push(this); }
    removeAttribute() { this.url = ''; }
  });
  const canvas = Object.assign(new EventTarget(), {
    width: 0, height: 0, dataset: {},
    getBoundingClientRect: () => ({ width: 265, height: 471 }),
    getContext: () => ({ drawImage() {} }),
  });
  const rect = { top: 96, height: 2080 };
  const section = { getBoundingClientRect: () => rect };
  const player = new ScrollFramePlayer({ canvas, section, mobile: false, onReady: () => ready++, onProgress() {}, onError: () => errors++ });
  const flush = () => { const callbacks = [...rafs.values()]; rafs.clear(); callbacks.forEach(fn => fn()); };
  const settle = () => {
    let count = 0;
    while (requests.length) {
      assert.ok(count++ < 200, 'frame loader must not loop or repeatedly reload its own cache');
      requests.shift().onload?.();
    }
  };
  return { player, canvas, rect, requests, windowMock, documentMock, flush, settle, errors: () => errors, ready: () => ready,
    restore() { player.destroy(); for (const [key, value] of Object.entries(originals)) { if (value === undefined) delete global[key]; else global[key] = value; } },
  };
}

test('loading is lazy, capped at four concurrent requests, and repaints a nearest frame', () => {
  const f = fixture();
  try {
    assert.equal(f.requests.length, 0);
    f.player.setActive(true); f.flush();
    assert.equal(f.requests.length, 4);
    f.settle();
    assert.equal(f.canvas.dataset.frame, '0');
    assert.ok(f.ready() > 0);
    f.rect.top = -1280;
    f.windowMock.dispatchEvent(new Event('scroll')); f.flush(); f.settle();
    assert.equal(f.canvas.dataset.frame, '143');
    assert.ok(f.player.images.size <= 28);
  } finally { f.restore(); }
});

test('pausing and a hidden tab stop playback; resuming catches up', () => {
  const f = fixture();
  try {
    f.player.setActive(true); f.flush(); f.settle();
    f.player.setPaused(true); f.rect.top = -1280;
    f.windowMock.dispatchEvent(new Event('scroll')); f.flush();
    assert.equal(f.canvas.dataset.frame, '0');
    f.player.setPaused(false); f.flush(); f.settle();
    assert.equal(f.canvas.dataset.frame, '143');
    f.documentMock.hidden = true; f.rect.top = 96;
    f.windowMock.dispatchEvent(new Event('scroll')); f.flush();
    assert.equal(f.canvas.dataset.frame, '143');
    f.documentMock.hidden = false;
    f.documentMock.dispatchEvent(new Event('visibilitychange')); f.flush(); f.settle();
    assert.equal(f.canvas.dataset.frame, '0');
  } finally { f.restore(); }
});

test('failed media falls back once instead of blanking the page or retrying forever', () => {
  const f = fixture();
  try {
    f.player.setActive(true); f.flush();
    for (let i = 0; i < 4; i++) f.requests.shift().onerror?.();
    assert.equal(f.errors(), 1);
    assert.equal(f.canvas.dataset.frame, undefined);
    assert.equal(f.player.images.size, 0);
  } finally { f.restore(); }
});

test('destroy cancels pending frame callbacks, image handlers and scroll subscriptions', () => {
  const f = fixture();
  try {
    f.player.setActive(true); f.flush();
    const pending = [...f.requests];
    f.player.destroy(); f.flush();
    assert.ok(pending.every(image => !image.onload && !image.onerror && image.url === ''));
    f.windowMock.dispatchEvent(new Event('scroll')); f.flush();
    assert.equal(f.ready(), 0);
    assert.equal(f.player.images.size, 0);
    f.player.destroy();
  } finally { f.restore(); }
});
