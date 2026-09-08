/* eslint-disable @typescript-eslint/no-require-imports -- Small CommonJS test loader. */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
module.exports = function loadTs(filename, mocks = {}) {
  const full = path.resolve(__dirname, '../src', filename);
  const target = new Module(full, module);
  target.paths = Module._nodeModulePaths(path.dirname(full));
  const original = target.require.bind(target);
  target.require = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith('@/')) return module.exports(`${id.slice(2)}.ts`, mocks);
    if (id.startsWith('.')) return module.exports(path.relative(path.resolve(__dirname, '../src'), path.resolve(path.dirname(full), `${id}.ts`)), mocks);
    return original(id);
  };
  target._compile(ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, full);
  return target.exports;
};
