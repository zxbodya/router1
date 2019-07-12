import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import tempDir from 'temp-dir';

export default {
  input: 'src/index.ts',
  external: ['rxjs', 'rxjs/operators', 'tslib'],
  output: [
    { file: pkg.main, sourcemap: true, format: 'cjs' },
    { file: pkg.module, sourcemap: true, format: 'es' },
  ],
  plugins: [typescript({ cacheRoot: `${tempDir}/.rpt2_cache` })],
};
