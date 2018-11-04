const typescript = require('rollup-plugin-typescript2');
const pkg = require('./package.json');

module.exports = {
  entry: 'src/index.ts',
  external: ['rxjs', 'tslib'],
  targets: [
    { dest: pkg.main, format: 'cjs' },
    { dest: pkg.module, format: 'es' },
  ],
  plugins: [
    typescript({ cacheRoot: `${require('temp-dir')}/.rpt2_cache` }),
  ],
  sourceMap: true,
};
