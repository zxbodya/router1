const typescript = require('rollup-plugin-typescript2');
const pkg = require('./package.json');

module.exports = {
  input: 'src/index.ts',
  external: ['rxjs', 'tslib'],
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' },
  ],
  plugins: [
    typescript({ cacheRoot: `${require('temp-dir')}/.rpt2_cache` }),
  ],
  sourcemap: true,
};
